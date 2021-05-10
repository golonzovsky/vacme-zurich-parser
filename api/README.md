# api (todo)

This one is to hide non-scalable python api behind scalable go caching layer.   

Python app has one pod for scraping zh.vacme.ch, so it will be down from time to time due to node restarts and redeployments. We cannot easily scale python scraper, cause it needs to deal with refresh tokens sharing and needs to be nice to vacme.ch (not to ddos it). Therefore this caching layer will just use python as origin. 

Maybe I'm overengineering here and simple CDN will do as good. 