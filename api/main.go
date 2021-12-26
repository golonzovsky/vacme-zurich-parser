package main

import (
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/golonzovsky/vacme/handlers/locations"
	dumpReq "github.com/golonzovsky/vacme/handlers/log"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

type server struct {
	router *gin.Engine
}

func (s *server) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	s.router.ServeHTTP(w, req)
}

func (s *server) registerRoutes() {
	s.router.GET("/health", s.handleHealthOk())
	s.router.GET("/metrics", s.handlePrometheus())
	//v2 := s.router.Group("/api/v2")
	s.router.POST("/api/v2/log", dumpReq.Log) //todo rename to twillio callback and check hmac(sha1)
	s.router.GET("/api/v2/locations", s.handleLocations())
}

func (s *server) handleHealthOk() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Status(200)
	}
}

func (s *server) handlePrometheus() gin.HandlerFunc {
	h := promhttp.Handler()
	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}

func (s *server) handleLocations() gin.HandlerFunc {
	parserApiBase := os.Getenv("PARSER_API_BASE") //todo extract to config viper, or move up to server
	placeApiKey := os.Getenv("PLACE_API_KEY")
	seedPlaceMappingLocation := os.Getenv("MAPPING_LOCATION")
	locationsFetcher := locations.NewFetcher(parserApiBase, placeApiKey, seedPlaceMappingLocation)
	return locationsFetcher.Handler
}

func newServer() *server {
	s := &server{gin.New()}
	s.registerRoutes()
	loggerIgnoreSysPath := gin.LoggerWithConfig(gin.LoggerConfig{
		SkipPaths: []string{"/health", "/metrics"},
	})
	s.router.Use(loggerIgnoreSysPath, gin.Recovery())
	return s
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	initLogger()

	srv := &http.Server{
		Addr:         ":8000",
		Handler:      newServer(),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 90 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
	go func() {
		log.Infof("Listening on %v", srv.Addr)
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

func initLogger() {
	log.SetFormatter(&log.TextFormatter{FullTimestamp: true, ForceColors: true})
	log.SetLevel(log.DebugLevel)
	gin.ForceConsoleColor()
}
