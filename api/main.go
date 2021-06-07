package main

import (
	"github.com/gin-gonic/gin"
	"github.com/golonzovsky/vacme/handlers"
	"github.com/golonzovsky/vacme/handlers/locations"
	log "github.com/sirupsen/logrus"
)

func main() {
	initLogger()

	r := gin.New()
	r.Use(loggerIgnoreSysPaths(), gin.Recovery())
	r.GET("/health", handlers.Ok)
	r.GET("/metrics", handlers.PrometheusMetrics())

	//v2 := r.Group("/api/v2")
	r.POST("/api/v2/log", handlers.Log) //todo rename to twillio callback and check hmac(sha1)
	r.GET("/api/v2/locations", locations.Locations)

	r.Run("0.0.0.0:8000")
}

func loggerIgnoreSysPaths() gin.HandlerFunc {
	return gin.LoggerWithConfig(gin.LoggerConfig{
		SkipPaths: []string{"/health", "/metrics"},
	})
}

func initLogger() {
	log.SetFormatter(&log.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(log.DebugLevel)
	gin.ForceConsoleColor()
}
