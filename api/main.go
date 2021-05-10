package main

import (
	"fmt"
	"github.com/sirupsen/logrus"
	"log"
	"net/http"
	"net/http/httputil"
)

func main() {
	initLogger()
	http.HandleFunc("/events/failed_lookup", logRequest)
	http.HandleFunc("/health", health)
	log.Fatal(http.ListenAndServe("0.0.0.0:8000", nil))
}

func health(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func logRequest(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)

	requestDump, err := httputil.DumpRequest(r, true)
	if err != nil {
		fmt.Println(err)
	}
	log.Println(string(requestDump))
}

func initLogger() {
	logger := logrus.New()
	logger.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	logger.SetLevel(logrus.WarnLevel)
	log.SetOutput(logger.Writer())
}
