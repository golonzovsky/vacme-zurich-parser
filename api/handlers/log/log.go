package log

import (
	"fmt"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"net/http/httputil"
)

func Log(c *gin.Context) {
	requestDump, err := httputil.DumpRequest(c.Request, true)
	if err != nil {
		fmt.Println(err)
	}
	log.Info(string(requestDump))
	c.Status(200)
}
