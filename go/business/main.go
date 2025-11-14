package main

import (
	"github.com/saichler/l8bus/go/overlay/vnet"
	"github.com/saichler/l8business/go/business/service"
	"github.com/saichler/l8types/go/ifs"
	"github.com/saichler/probler/go/prob/common"
)

func main() {
	resources := common.CreateResources("vnetbusiness")
	resources.SysConfig().VnetPort = service.VNET
	resources.Logger().SetLogLevel(ifs.Info_Level)
	net := vnet.NewVNet(resources)
	net.Start()
	resources.Logger().Info("vnet started!")
	resources.Logger().SetLogLevel(ifs.Error_Level)
	service.StartWebServer(13443, "/data/probler")
}
