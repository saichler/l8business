FROM saichler/builder:latest AS build

COPY main.go /home/src/github.com/saichler/build/main.go
COPY .netrc /root/.netrc

RUN go mod init
RUN GOPROXY=direct GOPRIVATE=github.com go mod tidy
RUN go build -o bweb

FROM saichler/probler-security:latest AS final
COPY --from=build /home/src/github.com/saichler/build/bweb /home/run/bweb
COPY ./web /home/run/web
COPY bay.json /home/run/bay.json
ENTRYPOINT ["/home/run/bweb"]