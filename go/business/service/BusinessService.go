package service

import (
	"os"
	"strconv"

	"github.com/saichler/l8bus/go/overlay/protocol"
	"github.com/saichler/l8bus/go/overlay/vnic"
	"github.com/saichler/l8business/go/types/business"
	"github.com/saichler/l8reflect/go/reflect/introspecting"
	"github.com/saichler/l8services/go/services/base"
	"github.com/saichler/l8types/go/ifs"
	"github.com/saichler/l8types/go/types/l8api"
	"github.com/saichler/l8types/go/types/l8health"
	"github.com/saichler/l8types/go/types/l8web"
	"github.com/saichler/l8utils/go/utils/web"
	"github.com/saichler/l8web/go/web/server"
	"github.com/saichler/probler/go/prob/common"
	"google.golang.org/protobuf/encoding/protojson"
)

const (
	ServiceName = "Business"
	ServiceArea = byte(0)
	VNET        = 22625
)

func StartWebServer(port int, cert string) {
	serverConfig := &server.RestServerConfig{
		Host:           protocol.MachineIP,
		Port:           port,
		Authentication: true,
		CertName:       cert,
		Prefix:         "service",
	}
	svr, err := server.NewRestServer(serverConfig)
	if err != nil {
		panic(err)
	}

	nic := createVnic(VNET, nil)

	//Activate the webpoints service
	sla := ifs.NewServiceLevelAgreement(&server.WebService{}, ifs.WebService, 0, false, nil)
	sla.SetArgs(svr)
	nic.Resources().Services().Activate(sla, nic)

	nic.Resources().Logger().Info("Web Server Started!")

	svr.Start()
}

func createVnic(vnet uint32, other ifs.IResources) ifs.IVNic {
	resources := common.CreateResources3("web-"+strconv.Itoa(int(vnet)), "", other)
	resources.SysConfig().VnetPort = vnet

	node, _ := resources.Introspector().Inspect(&business.Business{})
	introspecting.AddPrimaryKeyDecorator(node, "TaxId")

	nic := vnic.NewVirtualNetworkInterface(resources, nil)
	nic.Resources().SysConfig().KeepAliveIntervalSeconds = 60
	nic.Start()
	nic.WaitForConnection()
	Activate(nic)

	nic.Resources().Registry().Register(&business.Business{})
	nic.Resources().Registry().Register(&business.BusinessList{})
	nic.Resources().Registry().Register(&l8api.L8Query{})
	nic.Resources().Registry().Register(&l8web.L8Empty{})
	nic.Resources().Registry().Register(&l8health.L8Health{})
	nic.Resources().Registry().Register(&l8health.L8HealthList{})

	return nic
}

func Activate(vnic ifs.IVNic) {
	serviceConfig := ifs.NewServiceLevelAgreement(&base.BaseService{}, ServiceName, ServiceArea, true, nil)

	serviceConfig.SetServiceItem(&business.Business{})
	serviceConfig.SetServiceItemList(&business.BusinessList{})
	serviceConfig.SetPrimaryKeys("TaxId")

	meta := &business.BusinessData{}
	data, _ := os.ReadFile("bay.json")
	protojson.Unmarshal(data, meta)
	initData := []interface{}{}
	for _, b := range meta.Businesses {
		initData = append(initData, b)
	}
	serviceConfig.SetInitItems(initData)
	serviceConfig.SetVoter(true)
	serviceConfig.SetTransactional(false)

	serviceConfig.SetWebService(web.New(ServiceName, ServiceArea,
		nil, nil,
		nil, nil,
		nil, nil,
		nil, nil,
		&l8api.L8Query{}, &business.BusinessList{}))
	base.Activate(serviceConfig, vnic)
}
