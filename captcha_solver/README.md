# captcha solver

vacme uses this annoying WAF, which gives random captcha response to each new ip and for other unexpected reasons.  
https://docs.fortinet.com/document/fortiadc/6.0.1/handbook/36676/configuring-captcha  

So this model is to solve it programmatically. 

Its super simple model mostly copypasted from https://keras.io/examples/vision/captcha_ocr/  
Its just 2 Conv2D with pooling followed by 2 bidirectional LSTMs, seems to work well on this dataset of 400 images.  

We dont care of inference performance, cause none of requests are result of user traffic, only batch crawler errors.  
Therefore we can just serve model on CPUs. 
