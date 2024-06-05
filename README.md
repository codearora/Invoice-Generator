

# Invoice Generator

This project is a simple invoice generator application built with React and Node.js. It allows users to register, log in, add products, and generate invoices as PDF files.

## Features

- User Registration
- User Login
- Add Products
- List Products
- Generate Invoice as PDF

## Prerequisites

- Node.js
- npm (Node Package Manager)
- SQLite3

## Getting Started

### Backend Setup

1. **Clone the repository:**

    ```bash
    git clone https://github.com/codearora/invoice-generator.git
    cd invoice-generator
    ```

2. **Install backend dependencies:**

    ```bash
    cd server
    npm install
    ```

3. **Start the backend server:**

    ```bash
    node server.js
    ```

### Frontend Setup

1. **Navigate to the client directory:**

    ```bash
    cd ../client
    ```

2. **Install frontend dependencies:**

    ```bash
    npm install
    ```

3. **Start the frontend development server:**

    ```bash
    npm start
    ```

The frontend should now be running on `http://localhost:3000` and the backend on `http://localhost:5000`.

## API Endpoints

### User Registration

- **URL:** `/register`
- **Method:** `POST`
- **Body Parameters:**
  - `name` (string)
  - `email` (string)
  - `password` (string)
- **Response:**
  - `id` (integer)

### User Login

- **URL:** `/login`
- **Method:** `POST`
- **Body Parameters:**
  - `email` (string)
  - `password` (string)
- **Response:**
  - `id` (integer)
  - `name` (string)
  - `email` (string)

### Add Product

- **URL:** `/add-product`
- **Method:** `POST`
- **Headers:**
  - `email` (string)
- **Body Parameters:**
  - `name` (string)
  - `qty` (integer)
  - `rate` (number)
- **Response:**
  - `id` (integer)

### List Products

- **URL:** `/products`
- **Method:** `GET`
- **Headers:**
  - `email` (string)
- **Response:**
  - `products` (array of objects)

### Generate Invoice

- **URL:** `/generate-invoice`
- **Method:** `POST`
- **Headers:**
  - `email` (string)
- **Body Parameters:**
  - `products` (array of objects)
- **Response:**
  - PDF file

## Example Requests

### Register

```bash
curl -X POST http://localhost:5000/register -H "Content-Type: application/json" -d '{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}'
```

### Login

```bash
curl -X POST http://localhost:5000/login -H "Content-Type: application/json" -d '{
  "email": "john@example.com",
  "password": "password123"
}'
```

### Add Product

```bash
curl -X POST http://localhost:5000/add-product -H "Content-Type: application/json" -H "email: YOUR_EMAIL_HERE" -d '{
  "name": "Product 1",
  "qty": 10,
  "rate": 15.5
}'
```

### Generate Invoice

```bash
curl -X POST http://localhost:5000/generate-invoice -H "Content-Type: application/json" -H "email: YOUR_EMAIL_HERE" -d '{
  "products": [
    {
      "name": "Product 1",
      "qty": 10,
      "rate": 15.5
    }
  ]
}'
```

## Debugging

### Common Issues

- **404 Not Found:**
  Ensure that the backend server is running and the endpoints are correctly defined.
  
- **Empty Invoice PDF:**
  Ensure that products are correctly fetched and sent to the server. Check console logs for debugging.

### Logging

Add `console.log` statements at various points in your code to trace data flow and debug issues.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Create a new Pull Request

## Owner

- **Name:** Jai Arora
- **LinkedIn:** jaiarora6377@gmail.com
- **LinkedIn:** [Jai Arora](https://www.linkedin.com/in/jaiarora6377/)


Feel free to reach out for any questions or collaboration opportunities!

