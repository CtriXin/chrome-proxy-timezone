//go:build !windows
// +build !windows

package main

import "syscall"

func hideWindowAttr() *syscall.SysProcAttr {
	return nil
}
