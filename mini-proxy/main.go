package main

import (
	"archive/zip"
	"bytes"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
	"time"
)

const mihomoVersion = "v1.18.10"

type Server struct {
	workDir    string
	corePath   string
	cmd        *exec.Cmd
	running    bool
	configPath string
	subPath    string
}

type SubscribeReq struct {
	URL string `json:"url"`
	UA  string `json:"ua"`
}

type SwitchReq struct {
	Proxy string `json:"proxy"`
}

func main() {
	s := &Server{}
	if err := s.init(); err != nil {
		log.Fatalf("init failed: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/status", s.handleStatus)
	mux.HandleFunc("/subscribe", s.handleSubscribe)
	mux.HandleFunc("/nodes", s.handleNodes)
	mux.HandleFunc("/switch", s.handleSwitch)
	mux.HandleFunc("/delay", s.handleDelay)

	go func() {
		log.Println("Atlas Mini API listening on 127.0.0.1:28888")
		if err := http.ListenAndServe("127.0.0.1:28888", mux); err != nil {
			log.Fatal(err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh
	s.stopCore()
}

func (s *Server) init() error {
	dir, err := os.MkdirTemp("", "atlas-mini-*")
	if err != nil {
		return err
	}
	s.workDir = dir
	s.configPath = filepath.Join(dir, "config.yaml")
	s.subPath = filepath.Join(dir, "sub.yaml")

	coreDir, err := os.UserHomeDir()
	if err != nil {
		coreDir = "."
	}
	coreDir = filepath.Join(coreDir, ".atlas-mini")
	_ = os.MkdirAll(coreDir, 0755)

	coreName := "mihomo-core"
	if runtime.GOOS == "windows" {
		coreName += ".exe"
	}
	s.corePath = filepath.Join(coreDir, coreName)
	return nil
}

func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	resp := map[string]interface{}{
		"running":  s.running,
		"proxy":    "127.0.0.1:2080",
		"api":      "127.0.0.1:9090",
		"corePath": s.corePath,
	}
	if _, err := os.Stat(s.corePath); err == nil {
		resp["coreReady"] = true
		if s.running {
			if ok, _ := mihomoHealth(); ok {
				resp["mihomo"] = "ok"
			} else {
				resp["mihomo"] = "unreachable"
			}
		}
	} else {
		resp["coreReady"] = false
	}
	writeJSON(w, resp)
}

func (s *Server) handleSubscribe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req SubscribeReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.UA == "" {
		req.UA = "ClashForWindows/0.20.39"
	}

	if _, err := os.Stat(s.corePath); err != nil {
		if derr := downloadMihomoCore(s.corePath); derr != nil {
			http.Error(w, fmt.Sprintf("core not ready and download failed: %v", derr), http.StatusServiceUnavailable)
			return
		}
	}

	body, err := fetchSubscribe(req.URL, req.UA)
	if err != nil {
		http.Error(w, fmt.Sprintf("fetch subscribe failed: %v", err), http.StatusBadGateway)
		return
	}
	if err := os.WriteFile(s.subPath, body, 0644); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := s.writeConfig(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := s.restartCore(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	time.Sleep(800 * time.Millisecond)
	nodes, _ := s.listNodes()
	writeJSON(w, map[string]interface{}{"ok": true, "nodes": len(nodes)})
}

func (s *Server) handleNodes(w http.ResponseWriter, r *http.Request) {
	nodes, err := s.listNodes()
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	writeJSON(w, map[string]interface{}{"nodes": nodes})
}

func (s *Server) handleSwitch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req SwitchReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := s.switchNode(req.Proxy); err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	writeJSON(w, map[string]interface{}{"ok": true})
}

func (s *Server) handleDelay(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	url := r.URL.Query().Get("url")
	if url == "" {
		url = "http://www.gstatic.com/generate_204"
	}
	timeout := 5000
	res, err := proxyGet(fmt.Sprintf("http://127.0.0.1:9090/proxies/%s/delay?url=%s&timeout=%d", name, url, timeout))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
}

func (s *Server) writeConfig() error {
	cfg := fmt.Sprintf(`mixed-port: 2080
allow-lan: false
bind-address: 127.0.0.1
mode: rule
log-level: silent
external-controller: 127.0.0.1:9090
secret: ""
unified-delay: true
profile:
  store-selected: true
  store-fake-ip: true

tun:
  enable: false

proxy-providers:
  airport:
    type: file
    path: %s
    health-check:
      enable: true
      interval: 600
      url: http://www.gstatic.com/generate_204

proxy-groups:
  - name: "GLOBAL"
    type: select
    use:
      - airport
`, s.subPath)
	return os.WriteFile(s.configPath, []byte(cfg), 0644)
}

func (s *Server) restartCore() error {
	s.stopCore()
	s.cmd = exec.Command(s.corePath, "-f", s.configPath, "-d", s.workDir)
	s.cmd.Stdout = os.Stdout
	s.cmd.Stderr = os.Stderr
	s.cmd.SysProcAttr = hideWindowAttr()
	if err := s.cmd.Start(); err != nil {
		return err
	}
	s.running = true
	go func() {
		_ = s.cmd.Wait()
		s.running = false
	}()
	return nil
}

func (s *Server) stopCore() {
	if s.cmd != nil && s.cmd.Process != nil {
		_ = s.cmd.Process.Kill()
	}
	s.running = false
}

func (s *Server) listNodes() ([]string, error) {
	body, err := proxyGet("http://127.0.0.1:9090/proxies")
	if err != nil {
		return nil, err
	}
	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}
	proxies, ok := data["proxies"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected proxies format")
	}
	global, ok := proxies["GLOBAL"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("no GLOBAL group")
	}
	all, ok := global["all"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("no all nodes")
	}
	nodes := make([]string, 0, len(all))
	for _, v := range all {
		if s, ok := v.(string); ok {
			nodes = append(nodes, s)
		}
	}
	return nodes, nil
}

func (s *Server) switchNode(name string) error {
	payload := map[string]string{"name": name}
	b, _ := json.Marshal(payload)
	req, err := http.NewRequest(http.MethodPut, "http://127.0.0.1:9090/proxies/GLOBAL", bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		body, _ := io.ReadAll(res.Body)
		return fmt.Errorf("switch failed: %s", string(body))
	}
	return nil
}

func fetchSubscribe(url, ua string) ([]byte, error) {
	client := &http.Client{Timeout: 20 * time.Second}
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", ua)
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status %d", res.StatusCode)
	}
	return io.ReadAll(res.Body)
}

func mihomoHealth() (bool, error) {
	client := &http.Client{Timeout: 2 * time.Second}
	res, err := client.Get("http://127.0.0.1:9090/proxies")
	if err != nil {
		return false, err
	}
	defer res.Body.Close()
	return res.StatusCode == http.StatusOK, nil
}

func proxyGet(url string) ([]byte, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	res, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	return io.ReadAll(res.Body)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func downloadMihomoCore(dest string) error {
	var asset string
	var mirrors []string

	switch runtime.GOOS {
	case "darwin":
		asset = fmt.Sprintf("mihomo-darwin-%s-%s.gz", runtime.GOARCH, mihomoVersion)
	case "windows":
		asset = fmt.Sprintf("mihomo-windows-%s-%s.zip", runtime.GOARCH, mihomoVersion)
	case "linux":
		asset = fmt.Sprintf("mihomo-linux-%s-%s.gz", runtime.GOARCH, mihomoVersion)
	default:
		return fmt.Errorf("unsupported platform: %s/%s", runtime.GOOS, runtime.GOARCH)
	}

	base := fmt.Sprintf("https://github.com/MetaCubeX/mihomo/releases/download/%s/%s", mihomoVersion, asset)
	mirrors = append(mirrors, base)
	mirrors = append(mirrors, fmt.Sprintf("https://mirror.ghproxy.com/%s", base))
	mirrors = append(mirrors, fmt.Sprintf("https://ghproxy.com/%s", base))

	var lastErr error
	for _, url := range mirrors {
		log.Printf("downloading core from %s ...", url)
		body, err := fetchBinary(url)
		if err != nil {
			lastErr = err
			continue
		}
		log.Printf("downloaded %d bytes, extracting...", len(body))
		if err := extractAndSave(body, dest, runtime.GOOS); err != nil {
			lastErr = err
			continue
		}
		return nil
	}
	return fmt.Errorf("all mirrors failed: %v", lastErr)
}

func fetchBinary(url string) ([]byte, error) {
	client := &http.Client{Timeout: 60 * time.Second}
	res, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("http %d", res.StatusCode)
	}
	return io.ReadAll(res.Body)
}

func extractAndSave(data []byte, dest, goos string) error {
	dir := filepath.Dir(dest)
	_ = os.MkdirAll(dir, 0755)

	var bin []byte
	var err error
	if goos == "windows" {
		bin, err = unzipSingle(data)
	} else {
		bin, err = gunzipSingle(data)
	}
	if err != nil {
		return err
	}
	if err := os.WriteFile(dest, bin, 0755); err != nil {
		return err
	}
	return nil
}

func gunzipSingle(data []byte) ([]byte, error) {
	r, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("gunzip failed: %w", err)
	}
	defer r.Close()
	return io.ReadAll(r)
}

func unzipSingle(data []byte) ([]byte, error) {
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("unzip failed: %w", err)
	}
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			continue
		}
		defer rc.Close()
		return io.ReadAll(rc)
	}
	return nil, fmt.Errorf("no file found in zip")
}

