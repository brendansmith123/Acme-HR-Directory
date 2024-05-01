require("dotenv").config();
const pg = require("pg");
const express = require("express");
const app = express();
const client = new pg.Client(
  process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`
);

app.use(express.json());
app.use(require("morgan")("dev"));

// read
app.get("/api/department", async (req, res, next) => {
  try {
    const SQL = `SELECT * from department`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * from employees`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// create
app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
          INSERT INTO employees(name, department_id)
          VALUES($1, $2)
          RETURNING *
        `;
    console.log(req);
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

// update
app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
            UPDATE employees
            SET name=$1, department_id=$2, updated_at=now()
            WHERE id=$3
            RETURNING *
            `;
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// delete
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE from employees WHERE id = $1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// init function
const init = async () => {
  await client.connect();

  let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS department;
  
    CREATE TABLE department (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100)
    );
  
    CREATE TABLE employees (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      department_id INTEGER REFERENCES department(id) NOT NULL,
      name VARCHAR(255) NOT NULL
    );
    `;
  await client.query(SQL);
  console.log("tables created");

  SQL = `
    INSERT INTO department(name) VALUES('Human Resources');
    INSERT INTO department(name) VALUES('Electronics');
    INSERT INTO department(name) VALUES('Software');
  
    INSERT INTO employees(name, department_id) VALUES('Brendan', 
    (SELECT id FROM department WHERE name='Human Resources'));
  
    INSERT INTO employees(name, department_id) VALUES('Joel Embiid', 
    (SELECT id FROM department WHERE name='Electronics'));
  
    INSERT INTO employees(name, department_id) VALUES('Lebron James', 
    (SELECT id FROM department WHERE name='Software'));
  
    INSERT INTO employees(name, department_id) VALUES('James Harden', 
    (SELECT id FROM department WHERE name='Software'));
  
    INSERT INTO employees(name, department_id) VALUES('Nikola Jokic', 
    (SELECT id FROM department WHERE name='Software'));
  
    `;
  await client.query(SQL);
  console.log("data seeded");
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
};
init();
