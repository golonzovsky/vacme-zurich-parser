package handlers

import (
	"github.com/gin-gonic/gin"
)

func Ok(c *gin.Context) {
	c.Status(200)
}
