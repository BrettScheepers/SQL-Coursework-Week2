const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const port = 3000

app.use(bodyparser())

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cyf_ecommerce',
  password: 'Styles3100',
  port: 5432
});

// Get "/"
app.get('/', (req, res) => {
    res.json({ msg: 'hI'});
})

// Get "/customers"
app.get('/customers', (req, res) => {
  pool.query('SELECT * FROM customers', (error, result) => {
    res.json(result.rows);
  });
})

// Get "/customers/:customerId"
app.get('/customers/:customerId', (req, res) => {
  const customerId = req.params.customerId

  const query = 'SELECT * FROM customers WHERE id = $1'

  pool
    .query(query, [customerId])
    .then((result) => {
      res.json(result.rows)
    })
    .catch((e) => console.error(e))
})

// Get "/suppliers"
app.get('/suppliers', (req, res) => {
  pool.query('SELECT * FROM suppliers', (error, result) => {
    res.json(result.rows);
  });
})

// Get "/products"
app.get('/products', (req, res) => {
  const query = 'SELECT p.product_name, pa.unit_price, s.supplier_name FROM products p INNER JOIN product_availability pa ON p.id = pa.prod_id INNER JOIN suppliers s ON pa.supp_id = s.id'

  pool
    .query(query)
    .then((result) => res.json(result.rows))
    .catch((error) => console.error(error))
})

// Get "/products"
// app.get('/products', (req, res) => {
//   let query;

//   // let name = req.query.name

//   if (req.query.name) query = 'SELECT p.*, pa.unit_price, s.supplier_name FROM products p INNER JOIN product_availability pa ON p.id = pa.prod_id INNER JOIN suppliers s ON pa.supp_id = s.id WHERE p.product_name LIKE $1'
//   else query = 'SELECT p.*, pa.unit_price, s.supplier_name FROM products p INNER JOIN product_availability pa ON p.id = pa.prod_id INNER JOIN suppliers s ON pa.supp_id = s.id'

//   pool
//     .query(query, [name])
//     .then((result) => res.json(result.rows))
//     .catch((error) => console.error(error))
// })

// Post "/customers"
app.post('/customers', (req, res) => {
  const { name, address, city, country } = req.body

  pool
    .query('SELECT name FROM customers')
    .then((result) => {
      if (result.rows.some(el => el.name === name)) {
        return res
          .status(400)
          .send("An customer with the same name already exists!");
      } else {
        const query = "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)"

        pool
          .query(query, [name, address, city, country])
          .then(() => res.send("Customer created"))
          .catch((e) => console.error(e))
      }
    })
})

// Post "/products"
app.post('/products', (req, res) => {
  const { product_name: name } = req.body

  pool
    .query('SELECT product_name FROM products')
    .then((result) => {
      if (result.rows.some(el => el.product_name === name)) {
        return res
          .status(400)
          .send("A product with the same name already exists!");
      } else {
        const query = "INSERT INTO products (product_name) VALUES ($1)"

        pool
          .query(query, [name])
          .then(() => res.send("Product created"))
          .catch((e) => console.error(e))
      }
    })
})

// Post "/availability"
app.post('/availability', (req, res) => {
  const { prod_id: prodId, supp_id: suppId, unit_price: price } = req.body

  if (price <= 0) return res.status(400).send("Provide a product with a valid price")
  // product_id
  pool
    .query('SELECT id FROM products')
    .then((result) => {
      if (!result.rows.some(el => el.id === prodId)) return res.status(400).send("Provide a valid product")
      else {
        pool
          .query('SELECT id FROM suppliers')
          .then((result) => {
            if (!result.rows.some(el => el.id === suppId)) return res.status(400).send("Provide a valid supplier")
            else {
              const query = "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)"

              pool
                .query(query, [prodId, suppId, price])
                .then(() => res.send("Availability created"))
                .catch((e) => console.error(e))  
                  }
                })
      }
    })
})

// Post "/customers/:customerId/orders"
app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId
  const { order_date: date, order_reference: ref } = req.body

  pool
    .query('SELECT id FROM customers')
    .then((result) => {
      if (!result.rows.some(el => el.id == customerId)) {
        return res.status(400).send("Provide a valid customer")
      } 
      else {
        const query = 'INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)'

        pool
          .query(query, [date, ref, customerId])
          .then(() => res.send("Order created"))
          .catch((e) => console.error(e))
      }
    })
})

// Put "/customers/:customerId"
app.put('/customers/:customerId', (req, res) => {
  const customerId = req.params.customerId
  const { name, address, city, country } = req.body

  pool
    .query('SELECT id FROM customers')
    .then((result) => {
      if (!result.rows.some(el => el.id == customerId)) {
        return res
          .status(400)
          .send("No customer found!");
      } else {
        const query = "UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5"

        pool
          .query(query, [name, address, city, country, customerId])
          .then(() => res.send("Customer updated"))
          .catch((e) => console.error(e))
      }
    })
})

// Delete "/orders/:orderId"
app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId

  pool
  .query('SELECT id FROM orders')
  .then((result) => {
    if (!result.rows.some(el => el.id == orderId)) {
      return res.send("No order found!")
    } 
    else {
        
      let query = 'DELETE FROM order_items WHERE id = $1; DELETE FROM order WHERE id = $1'

        
      pool
          .query(query, [orderId])
          .then(() => res.send("Order deleted!"))
          .catch((e) => console.error(e))
      }
    })
    // .catch((e) => console.error(e))
})

// Delete "/customers/:customerId"
app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId

  pool
    .query('SELECT * FROM orders WHERE id = $1', [customerId])
    .then((result) => {
      if (result.rows === 0) {
        let query = 'DELETE FROM customers WHERE id = $1'

        pool
            .query(query, [customerId])
            .then(() => res.send("Customer deleted!"))
            .catch((e) => console.error(e))
      } 
      else {
        return res.send("Customer still has orders")
      }
    })
    // .catch((e) => console.error(e))
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})