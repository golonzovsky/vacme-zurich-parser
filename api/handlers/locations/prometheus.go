package locations

import "github.com/prometheus/client_golang/prometheus"

var TotalCount = prometheus.NewGauge(prometheus.GaugeOpts{
	Name: "vacme_location_count",
	Help: "served locations count"})

var ActiveCount = prometheus.NewGauge(prometheus.GaugeOpts{
	Name: "vacme_location_active_count",
	Help: "served locations with active appointments count",
})

var LastSuccessfulFetchTime = prometheus.NewGauge(prometheus.GaugeOpts{
	Name: "vacme_last_successful_update_time",
	Help: "time of last successful update",
})

var DataStaleForMs = prometheus.NewGauge(prometheus.GaugeOpts{
	Name: "vacme_data_stale_sec",
	Help: "age of data from parser",
})

func init() {
	prometheus.MustRegister(TotalCount, ActiveCount, LastSuccessfulFetchTime, DataStaleForMs)
}
