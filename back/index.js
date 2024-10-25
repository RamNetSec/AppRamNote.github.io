// backend/index.js
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

// Configuración de la base de datos SQLite usando Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

// Definición de modelos
const Note = sequelize.define('Note', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  attachedFiles: {
    type: DataTypes.STRING, // Almacenaremos los archivos adjuntos como una cadena separada por comas
    allowNull: true,
    get() {
      const value = this.getDataValue('attachedFiles');
      return value ? value.split(',') : [];
    },
    set(value) {
      this.setDataValue('attachedFiles', value.join(','));
    }
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Groups',
      key: 'id',
    },
  },
  categories: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tags: {
    type: DataTypes.STRING, // Almacenaremos las etiquetas como una cadena separada por comas
    allowNull: true,
    get() {
      const value = this.getDataValue('tags');
      return value ? value.split(',') : [];
    },
    set(value) {
      this.setDataValue('tags', value.join(','));
    }
  },
});

const Group = sequelize.define('Group', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const app = express();
app.use(express.json());
app.use(cors());

// Sincronizar la base de datos
sequelize.sync().then(() => {
  console.log('Database & tables created!');
});

// CRUD endpoints
app.get('/api/notes', async (req, res) => {
  const notes = await Note.findAll();
  res.send(notes);
});

app.post('/api/notes', async (req, res) => {
  const note = await Note.create(req.body);
  res.send(note);
});

app.put('/api/notes/:id', async (req, res) => {
  const note = await Note.update(req.body, { where: { id: req.params.id } });
  res.send(note);
});

app.delete('/api/notes/:id', async (req, res) => {
  await Note.destroy({ where: { id: req.params.id } });
  res.send('Note deleted');
});

app.get('/api/notes/:id', async (req, res) => {
  const note = await Note.findByPk(req.params.id);
  if (note) {
    res.send(note);
  } else {
    res.status(404).send('Note not found');
  }
});

app.get('/api/groups', async (req, res) => {
  const groups = await Group.findAll();
  res.send(groups);
});

app.get('/api/groups/:id/notes', async (req, res) => {
  const notes = await Note.findAll({ where: { groupId: req.params.id } });
  res.send(notes);
});

app.post('/api/groups', async (req, res) => {
  const group = await Group.create(req.body);
  res.send(group);
});

app.put('/api/groups/:id', async (req, res) => {
  const group = await Group.update(req.body, { where: { id: req.params.id } });
  res.send(group);
});

app.delete('/api/groups/:id', async (req, res) => {
  await Group.destroy({ where: { id: req.params.id } });
  res.send('Group deleted');
});

app.listen(5000, () => console.log('Server running on port 5000'));
