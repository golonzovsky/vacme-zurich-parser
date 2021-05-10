FROM golang AS builder

ENV GO111MODULE=on
WORKDIR /app
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -installsuffix cgo -o /server .

#FROM alpine:latest
FROM scratch
#RUN apk --no-cache add ca-certificates
COPY --from=builder /server /
EXPOSE 8000
#CMD /app
ENTRYPOINT ["/server"]