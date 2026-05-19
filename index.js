// ***** Paquetes requeridos *****
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

// ***** Instancia *****
const app = express();

// ***** Configuración *****
app.set('view engine', 'ejs');

// ***** Middleware *****
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// ***** Conexión DB *****
// OPEN_CREATE permite crearla si no existe
const db = new sqlite3.Database('./datos.db',
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (error) => {
    if (error) {
      console.log('❌ DB CONNECTION FAILED');
    } else {
      console.log('✅ CONNECTION SUCCESSFUL');
    }
  }
);

// Crear tablas automáticamente si no existen
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS marcas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marca TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      marca INTEGER,
      precio REAL,
      stock INTEGER,
      FOREIGN KEY (marca) REFERENCES marcas(id)
    )
  `);
});

// ===== RUTAS =====

// Página principal
app.get('/', (req, res) => {
  let sql = `
    SELECT productos.id, nombre, marcas.marca, precio, stock
    FROM productos
    INNER JOIN marcas ON productos.marca = marcas.id
  `;

  db.all(sql, (error, resultado) => {
    if (error) {
      console.log('❌ CONSULT FAILED');
      return res.send("Error en consulta principal");
    }

    db.all("SELECT * FROM marcas", (error, marcas) => {
      if (error) {
        console.log('❌ CONSULT MARKS FAILED');
        return res.send("Error en consulta marcas");
      }

      res.render('principal.ejs', { resultado, marcas });
    });
  });
});

// Nuevo producto
app.post('/nuevo', (req, res) => {
  const { nombre, marca, precio, stock } = req.body;

  const sql = `
    INSERT INTO productos (nombre, marca, precio, stock)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [nombre, marca, precio, stock], (error) => {
    if (error) {
      console.log('❌ INSERT FAILED');
      return res.send("Error insertando");
    }

    res.redirect('/');
  });
});

// Eliminar producto
app.get('/eliminar', (req, res) => {
  const id = req.query.id;

  db.run('DELETE FROM productos WHERE id = ?', [id], (error) => {
    if (error) {
      console.log('❌ DELETE FAILED');
      return res.send("Error eliminando");
    }

    res.redirect('/');
  });
});

// Editar producto (form)
app.get('/edit', (req, res) => {
  const id = req.query.id;

  db.all('SELECT * FROM productos WHERE id = ?', [id], (error, fila) => {
    if (error) {
      console.log('❌ SEARCH FAILED');
      return res.send("Error buscando");
    }

    db.all('SELECT * FROM marcas', (error, marcas) => {
      if (error) {
        console.log('❌ CONSULT MARK FAILED');
        return res.send("Error marcas");
      }

      res.render('edit.ejs', { fila, marcas });
    });
  });
});

// Actualizar producto
app.post('/editar', (req, res) => {
  const { id, nombre, marca, precio, stock } = req.body;

  const sql = `
    UPDATE productos
    SET nombre = ?, marca = ?, precio = ?, stock = ?
    WHERE id = ?
  `;

  db.run(sql, [nombre, marca, precio, stock, id], (error) => {
    if (error) {
      console.log('❌ UPDATE FAILED');
      return res.send("Error actualizando");
    }

    res.redirect('/');
  });
});

// Buscar producto
app.post('/search', (req, res) => {
  const nombre = req.body.buscar;

  let sql = `
    SELECT productos.id, nombre, marcas.marca, precio, stock
    FROM productos
    INNER JOIN marcas ON productos.marca = marcas.id
    WHERE nombre LIKE ?
  `;

  db.all(sql, [nombre + '%'], (error, resultado) => {
    if (error) {
      console.log('❌ SEARCH FAILED');
      return res.send("Error búsqueda");
    }

    db.all("SELECT * FROM marcas", (error, marcas) => {
      if (error) {
        console.log('❌ CONSULT MARKS FAILED');
        return res.send("Error marcas");
      }

      res.render('principal.ejs', { resultado, marcas });
    });
  });
});

// ===== MARCAS =====

// Ver marcas
app.get('/marcas', (req, res) => {
  db.all('SELECT * FROM marcas ORDER BY marca', (error, filas) => {
    if (error) {
      console.log('❌ FAILED MARCAS');
      return res.send("Error marcas");
    }

    res.render('marcas.ejs', { filas });
  });
});

// Nueva marca
app.post('/nueva_marca', (req, res) => {
  const marca = req.body.marca;

  db.run('INSERT INTO marcas (marca) VALUES (?)', [marca], (error) => {
    if (error) {
      console.log('❌ FAILED INSERT MARCA');
      return res.send("Error insert marca");
    }

    res.redirect('/marcas');
  });
});

// Editar marca (form)
app.get('/editar_marca', (req, res) => {
  const id = req.query.id;

  db.all('SELECT * FROM marcas WHERE id = ?', [id], (error, fila) => {
    if (error) {
      console.log('❌ FAILED EDIT MARCA');
      return res.send("Error edit marca");
    }

    res.render('editar_marcas.ejs', { fila });
  });
});

// Actualizar marca
app.post('/editar_marca', (req, res) => {
  const { id, marca } = req.body;

  db.run('UPDATE marcas SET marca = ? WHERE id = ?', [marca, id], (error) => {
    if (error) {
      console.log('❌ FAILED UPDATE MARCA');
      return res.send("Error update marca");
    }

    res.redirect('/marcas');
  });
});

// Eliminar marca
app.get('/eliminar_marca', (req, res) => {
  const id = req.query.id;

  db.run('DELETE FROM marcas WHERE id = ?', [id], (error) => {
    if (error) {
      console.log('❌ FAILED DELETE MARCA');
      return res.send("Error delete marca");
    }

    res.redirect('/marcas');
  });
});

// ===== PUERTO DINÁMICO PARA RENDER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});