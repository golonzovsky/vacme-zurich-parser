FROM golang:1.17.1 AS builder

ENV GO111MODULE=on
WORKDIR /app
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -installsuffix cgo -o /server .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /server /
COPY locationMapping.json /
EXPOSE 8000
ENTRYPOINT ["/server"]