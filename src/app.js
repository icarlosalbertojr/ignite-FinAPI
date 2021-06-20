const express = require("express");
const uuid = require("uuid").v4;
const app = express();
app.use(express.json());

const customers = [];

function verifyAccountExistsCpf(req, res, next) {
  const { cpf } = req.params;
  const customer = customers.find((customer) => customer.cpf === cpf);
  if (!customer) {
    res.json({ error: "Customer not exists!" }).status(404);
  }
  req.customer = customer;
  next();
}

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;
  const exists = customers.some((customer) => customer.cpf === cpf);
  if (exists) {
    res
      .json({ error: "Account can not be created. Cpf already exists!" })
      .status(400);
  }
  const customer = { id: uuid(), cpf, name, statement: [], total: 0 };
  customers.push(customer);
  res.json(customer).status(201);
});

app.patch("/account/:cpf", verifyAccountExistsCpf, (req, res) => {
  const { name } = req.body;
  const { customer } = req;
  customer.name = name;
  res.json(customer).status(200);
});

app.delete("/account/:cpf", verifyAccountExistsCpf, (req, res) => {
  const { customer } = req;
  customers.splice(customer, 1);
  res.json(customers).status(200);
});

app.get("/account/:cpf/statement", verifyAccountExistsCpf, (req, res) => {
  const { customer } = req;
  res
    .json({
      customerid: customer.id,
      total: customer.total,
      statement: customer.statement,
    })
    .status(200);
});

app.get("/account/:cpf/statement/date", verifyAccountExistsCpf, (req, res) => {
  const { customer } = req;
  const { date } = req.query;
  const statementByDate = customer.statement.filter((statement) => {
    return new Date(statement.date).toLocaleDateString() === date;
  });
  res
    .json({
      customerid: customer.id,
      total: customer.total,
      statement: statementByDate,
    })
    .status(200);
});

app.post("/account/:cpf/deposit", verifyAccountExistsCpf, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;
  const statement = { id: uuid(), type: "Credit", date: new Date(), amount };
  customer.total += amount;
  customer.statement.push(statement);
  res.json({ total: customer.total, statement }).status(201);
});

app.post("/account/:cpf/withdraw", verifyAccountExistsCpf, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;
  if (customer.total < amount) {
    res.json({ error: "Amount unavailable!" });
  }
  const statement = { id: uuid(), type: "Withdraw", date: new Date(), amount };
  customer.total -= amount;
  customer.statement.push(statement);
  res.json({ total: customer.total, statement }).status(201);
});

app.listen(3001);
