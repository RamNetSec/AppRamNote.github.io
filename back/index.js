// backend/index.js

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Sequelize, DataTypes } = require('sequelize');

// Configuración de la base de datos SQLite usando Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
});

// Configuración de almacenamiento para archivos usando multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

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
      if (Array.isArray(value)) {
        this.setDataValue('attachedFiles', value.join(','));
      } else {
        this.setDataValue('attachedFiles', value);
      }
    },
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
      if (Array.isArray(value)) {
        this.setDataValue('tags', value.join(','));
      } else {
        this.setDataValue('tags', value);
      }
    },
  },
});

const Group = sequelize.define('Group', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Relación entre modelos
Group.hasMany(Note, { foreignKey: 'groupId' });
Note.belongsTo(Group, { foreignKey: 'groupId' });

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sincronizar la base de datos
sequelize.sync().then(() => {
  console.log('Database & tables created!');
});

// CRUD endpoints para Notas
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.findAll();
    res.json(notes);
  } catch (error) {
    res.status(500).send('Error fetching notes');
  }
});

app.post('/api/notes', upload.array('attachedFiles', 10), async (req, res) => {
  try {
    const attachedFiles = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const noteData = { ...req.body, attachedFiles };
    const note = await Note.create(noteData);
    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating note');
  }
});

app.put('/api/notes/:id', upload.array('attachedFiles', 10), async (req, res) => {
  try {
    let attachedFiles = req.body.attachedFiles ? req.body.attachedFiles.split(',') : [];
    if (req.files && req.files.length > 0) {
      attachedFiles = [...attachedFiles, ...req.files.map(file => `/uploads/${file.filename}`)];
    }
    const noteData = { ...req.body, attachedFiles };
    const [updated] = await Note.update(noteData, {
      where: { id: req.params.id },
    });
    if (updated) {
      const updatedNote = await Note.findByPk(req.params.id);
      res.json(updatedNote);
    } else {
      res.status(404).send('Note not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating note');
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) {
      return res.status(404).send('Note not found');
    }
    // Eliminar archivos adjuntos del sistema de archivos
    const attachedFiles = note.attachedFiles;
    attachedFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    await Note.destroy({
      where: { id: req.params.id },
    });
    res.send('Note deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting note');
  }
});

app.get('/api/notes/:id', async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (note) {
      res.json(note);
    } else {
      res.status(404).send('Note not found');
    }
  } catch (error) {
    res.status(500).send('Error fetching note');
  }
});

// CRUD endpoints para Grupos
app.get('/api/groups', async (req, res) => {
  try {
    const groups = await Group.findAll();
    res.json(groups);
  } catch (error) {
    res.status(500).send('Error fetching groups');
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const group = await Group.create(req.body);
    res.json(group);
  } catch (error) {
    res.status(500).send('Error creating group');
  }
});

app.put('/api/groups/:id', async (req, res) => {
  try {
    const [updated] = await Group.update(req.body, {
      where: { id: req.params.id },
    });
    if (updated) {
      const updatedGroup = await Group.findByPk(req.params.id);
      res.json(updatedGroup);
    } else {
      res.status(404).send('Group not found');
    }
  } catch (error) {
    res.status(500).send('Error updating group');
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  try {
    const deleted = await Group.destroy({
      where: { id: req.params.id },
    });
    if (deleted) {
      res.send('Group deleted');
    } else {
      res.status(404).send('Group not found');
    }
  } catch (error) {
    res.status(500).send('Error deleting group');
  }
});

app.get('/api/groups/:id/notes', async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: { groupId: req.params.id },
    });
    res.json(notes);
  } catch (error) {
    res.status(500).send('Error fetching notes for group');
  }
});

// Iniciar el servidor
app.listen(5000, () => console.log('Server running on port 5000'));