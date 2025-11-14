package main

import (
	"github.com/saichler/l8bus/go/overlay/vnet"
	"github.com/saichler/l8business/go/bservice/bservice"
	"github.com/saichler/l8types/go/ifs"
	"github.com/saichler/probler/go/prob/common"
)

func main() {
	resources := common.CreateResources("vnetbusiness")
	resources.SysConfig().VnetPort = bservice.VNET
	resources.Logger().SetLogLevel(ifs.Info_Level)
	net := vnet.NewVNet(resources)
	net.Start()
	resources.Logger().Info("vnet started!")
	bservice.StartWebServer(13443, "/data/probler")
}
