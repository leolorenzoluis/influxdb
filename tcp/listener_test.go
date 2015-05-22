package tcp_test

import (
	"fmt"
	"testing"
	"time"

	"github.com/davecgh/go-spew/spew"
	"github.com/influxdb/influxdb/data"
	"github.com/influxdb/influxdb/tcp"
)

type testServer struct {
	writeShardFunc func(shardID uint64, points []data.Point) (int, error)
}

func newTestServer(f func(shardID uint64, points []data.Point) (int, error)) testServer {
	return testServer{
		writeShardFunc: f,
	}
}

type serverResponses []serverResponse
type serverResponse struct {
	shardID uint64
	points  []data.Point
}

func (t testServer) WriteShard(shardID uint64, points []data.Point) (int, error) {
	return t.writeShardFunc(shardID, points)
}

func writeShardSuccess(shardID uint64, points []data.Point) (int, error) {
	responses <- &serverResponse{
		shardID: shardID,
		points:  points,
	}
	return 1, nil
}

func writeShardFail(shardID uint64, points []data.Point) (int, error) {
	return 0, fmt.Errorf("failed to write")
}

var responses = make(chan *serverResponse, 1024)

func (testServer) ResponseN(n int) ([]*serverResponse, error) {
	var a []*serverResponse
	for {
		select {
		case r := <-responses:
			a = append(a, r)
			if len(a) == n {
				return a, nil
			}
		case <-time.After(time.Second):
			return a, fmt.Errorf("unexpected response count: expected: %d, actual: %d", n, len(a))
		}
	}
}

func TestServer_Close_ErrServerClosed(t *testing.T) {
	var (
		ts testServer
		s  = tcp.NewServer(ts)
	)

	// Start on a random port
	_, e := s.ListenAndServe("127.0.0.1:0")
	if e != nil {
		t.Fatalf("err does not match.  expected %v, got %v", nil, e)
	}

	// Close the server
	s.Close()

	// Try to close it again
	if err := s.Close(); err != tcp.ErrServerClosed {
		t.Fatalf("expected an error, got %v", err)
	}
}

func TestServer_Close_ErrBindAddressRequired(t *testing.T) {
	var (
		ts testServer
		s  = tcp.NewServer(ts)
	)

	// Start on a random port
	_, e := s.ListenAndServe("")
	if e == nil {
		t.Fatalf("exprected error %s, got nil.", tcp.ErrBindAddressRequired)
	}

}
func TestServer_WriteShardRequestSuccess(t *testing.T) {
	var (
		ts = newTestServer(writeShardSuccess)
		s  = tcp.NewServer(ts)
	)
	// Close the server
	defer s.Close()

	// Start on a random port
	host, e := s.ListenAndServe("127.0.0.1:0")
	if e != nil {
		t.Fatalf("err does not match.  expected %v, got %v", nil, e)
	}

	client := tcp.NewClient()
	err := client.Dial(host)
	if err != nil {
		t.Fatal(err)
	}

	now := time.Now()

	shardID := uint64(1)
	var points []data.Point
	points = append(points, data.Point{
		Name:   "cpu",
		Time:   now,
		Tags:   data.Tags{"host": "server01"},
		Fields: map[string]interface{}{"value": int64(100)},
	})

	if err := client.WriteShard(shardID, points); err != nil {
		t.Fatal(err)
	}

	if err := client.Close(); err != nil {
		t.Fatal(err)
	}

	responses, err := ts.ResponseN(1)
	if err != nil {
		t.Fatal(err)
	}

	response := responses[0]

	if shardID != response.shardID {
		t.Fatalf("unexpected shardID.  exp: %d, got %d", shardID, response.shardID)
	}

	got := response.points[0]
	exp := points[0]
	t.Log("got: ", spew.Sdump(got))
	t.Log("exp: ", spew.Sdump(exp))

	if got.Name != exp.Name {
		t.Fatal("unexpected name")
	}

	if got.Fields["value"] != exp.Fields["value"] {
		t.Fatal("unexpected fields")
	}

	if got.Tags["host"] != exp.Tags["host"] {
		t.Fatal("unexpected tags")
	}

	if got.Time.UnixNano() != exp.Time.UnixNano() {
		t.Fatal("unexpected time")
	}
}

func TestServer_WriteShardRequestFail(t *testing.T) {
	var (
		ts = newTestServer(writeShardFail)
		s  = tcp.NewServer(ts)
	)
	// Close the server
	defer s.Close()

	// Start on a random port
	host, e := s.ListenAndServe("127.0.0.1:0")
	if e != nil {
		t.Fatalf("err does not match.  expected %v, got %v", nil, e)
	}

	client := tcp.NewClient()
	err := client.Dial(host)
	if err != nil {
		t.Fatal(err)
	}

	now := time.Now()

	shardID := uint64(1)
	var points []data.Point
	points = append(points, data.Point{
		Name:   "cpu",
		Time:   now,
		Tags:   data.Tags{"host": "server01"},
		Fields: map[string]interface{}{"value": int64(100)},
	})

	if err, exp := client.WriteShard(shardID, points), "error code 1: failed to write"; err == nil || err.Error() != exp {
		t.Fatalf("expected error %s, got %v", exp, err)
	}
}
