package tests

import (
	"fmt"
	"os"
	"testing"

	"github.com/saichler/l8business/go/types/l8business"
	"google.golang.org/protobuf/encoding/protojson"
)

func TestJson(t *testing.T) {
	bd := &l8business.L8BusinessData{}
	data, _ := os.ReadFile("bay.json")
	err := protojson.Unmarshal(data, bd)
	if err != nil {
		t.Fail()
		fmt.Println(err)
		return
	}
}
