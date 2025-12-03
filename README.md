# L8Business

A high-performance microservice for managing and serving business directory data, built on the L8 distributed services ecosystem.

## Overview

L8Business provides a complete solution for business directory management with:

- **RESTful API** for programmatic access to business data
- **Modern Web UI** with search, filtering, and pagination
- **Distributed Architecture** using virtual network interfaces (VNIC)
- **Protocol Buffers** for efficient serialization

## Features

- Full-text search across business records
- Advanced filtering by city, state, and business segment
- Pagination with metadata aggregation
- Grid and list view modes
- Authentication support
- TLS/SSL encrypted connections

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Web Frontend (SPA)                    │
│              HTML5 / JavaScript / CSS3                   │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS (Port 13443)
┌─────────────────────────▼───────────────────────────────┐
│                   Business Service                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  REST API   │  │  Data Store │  │  Metadata Mgr   │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │ VNIC (Port 22625)
┌─────────────────────────▼───────────────────────────────┐
│              L8 Virtual Network Layer                    │
│         Distributed Service Communication                │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
l8business/
├── go/
│   ├── bservice/           # Business service application
│   │   ├── main.go         # Entry point
│   │   ├── bservice/       # Service implementation
│   │   └── web/            # Frontend assets
│   ├── types/              # Protocol buffer generated types
│   │   └── l8business/     # Business message definitions
│   └── tests/              # Integration tests
├── proto/                  # Protocol buffer definitions
│   └── business.proto      # Business schema
├── resources/              # Data files
└── LICENSE                 # Apache 2.0
```

## Prerequisites

- Go 1.25+
- Protocol Buffers compiler (for schema changes)
- Docker (optional, for protobuf generation)

## Installation

```bash
# Clone the repository
git clone https://github.com/saichler/l8business.git
cd l8business

# Build the service
cd go/bservice
go build -o l8business .
```

## Running the Service

```bash
cd go/bservice
./l8business
```

The service will:
1. Initialize the virtual network interface on port 22625
2. Load business data from `bay.json`
3. Start the web server on port 13443 (HTTPS)

Access the web UI at: `https://localhost:13443`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/service/l8business` | List businesses with pagination |
| GET | `/service/l8business?page=N` | Get page N of results |
| GET | `/service/l8business?city=X` | Filter by city |
| GET | `/service/l8business?state=X` | Filter by state |
| GET | `/service/l8business?segment=X` | Filter by business segment |

### Response Format

```json
{
  "data": [...],
  "metadata": {
    "keyCount": {
      "Total": 60000
    },
    "valueCount": {
      "city": {...},
      "segment": {...}
    }
  }
}
```

## Business Segments

The directory categorizes businesses into segments including:
- Professional Services
- Construction
- Real Estate
- Food & Beverage
- Healthcare & Wellness
- Retail & E-commerce
- Technology & Software
- And more...

## Data Model

The core `L8Business` type includes:

| Field | Type | Description |
|-------|------|-------------|
| name | string | Business name |
| owner | string | Owner name |
| address | string | Street address |
| city | string | City |
| state | string | State |
| zip | string | ZIP code |
| phone | string | Contact phone |
| segment | string | Business category |
| start_date | string | Registration date |
| certificate_number | string | Business certificate |

## Development

### Regenerating Protocol Buffers

```bash
cd proto
./make-bindings.sh
```

### Running Tests

```bash
cd go/tests
go test -v ./...
```

## Dependencies

This project is part of the L8 ecosystem:

- [l8bus](https://github.com/saichler/l8bus) - Virtual networking layer
- [l8services](https://github.com/saichler/l8services) - Service framework
- [l8web](https://github.com/saichler/l8web) - Web server framework
- [l8types](https://github.com/saichler/l8types) - Shared types
- [l8utils](https://github.com/saichler/l8utils) - Utility functions

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
