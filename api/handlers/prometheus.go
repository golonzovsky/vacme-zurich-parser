package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var LocationsTotalCount = prometheus.NewGauge(prometheus.GaugeOpts{
	Name: "vacme_location_count",
	Help: "served locations count"})

var LocationsActiveCount = prometheus.NewGauge(prometheus.GaugeOpts{
	Name: "vacme_location_active_count",
	Help: "served locations with active appointments count",
})

var LastSuccessfulFetchTime = prometheus.NewGauge(prometheus.GaugeOpts{
	Name: "vacme_last_successful_update_time",
	Help: "time of last successful update",
})

func init() {
	prometheus.MustRegister(LocationsTotalCount, LocationsActiveCount, LastSuccessfulFetchTime)
}

func PrometheusHandler() gin.HandlerFunc {
	h := promhttp.Handler()

	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}
