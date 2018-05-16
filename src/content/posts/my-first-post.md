---
title: "My First Post"
date: 2018-05-16T23:26:06+03:00
draft: true
showDate: true
tags: ["blog","story"]
---

# Test posts

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer tempor molestie viverra. Phasellus tristique auctor maximus. Nulla euismod, est sit amet varius ornare, ex nisl sodales justo, vitae euismod libero turpis sed turpis. Phasellus dapibus nec ligula at fringilla. Donec sit amet libero ornare mi viverra pharetra. Curabitur semper magna et nulla luctus, eu tincidunt lacus bibendum. Sed nec lacus eget nisl eleifend placerat nec ornare ligula. Sed faucibus diam at arcu hendrerit aliquam. &copy;

```golang
package usecases

// Predefined roles
const (
	RoleAdmin    = "admin"
	RoleCustomer = "customer"
)

// Role struct
type Role struct {
	ID           string `gorm:"primary_key;type:varchar(50)"`
	Title        string
	IsSystemRole bool
}

// RoleRepository interface
type RoleRepository interface {
	GetByID(id string) (Role, error)
}
```
