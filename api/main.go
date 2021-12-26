package main

import (
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/golonzovsky/vacme/handlers"
	"github.com/golonzovsky/vacme/handlers/locations"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	initLogger()

	r := gin.New()
	r.Use(loggerIgnoreSysPaths(), gin.Recovery())

	r.GET("/health", handlers.Ok)
	r.GET("/metrics", handlers.PrometheusMetrics())

	//v2 := r.Group("/api/v2")
	r.POST("/api/v2/log", handlers.Log) //todo rename to twillio callback and check hmac(sha1)
	r.GET("/api/v2/locations", locations.NewFetcher().Handler)

	//r.Run("0.0.0.0:8000")
	srv := &http.Server{
		Addr:    ":8000",
		Handler: r,
	}
	go func() {
		if err := srv.ListenAndServe(); err != nil && errors.Is(err, http.ErrServerClosed) {
			log.Printf("listen: %s\n", err)
		}
	}()
	registerGracefulShutdown(ctx, stop, srv)
}

func registerGracefulShutdown(ctx context.Context, stop context.CancelFunc, srv *http.Server) {
	<-ctx.Done()
	stop()
	log.Println("shutting down gracefully, press Ctrl+C again to force")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}
	log.Println("Server exiting")
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
