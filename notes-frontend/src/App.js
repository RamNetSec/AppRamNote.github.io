// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AppBar, Toolbar, IconButton, Typography, Switch, Container, Grid, Paper, List, ListItem, ListItemText, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, CssBaseline, useMediaQuery } from '@mui/material';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import MenuIcon from '@mui/icons-material/Menu';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Dropzone from 'react-dropzone';

function App() {
  const [notes, setNotes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [openGroupModal, setOpenGroupModal] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [editGroup, setEditGroup] = useState(null);
  const [viewMode, setViewMode] = useState('render'); // render or code
  const [attachedFiles, setAttachedFiles] = useState([]);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) fetchNotes(selectedGroup.id);
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchNotes = async (groupId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/groups/${groupId}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleThemeChange = () => {
    setDarkMode(!darkMode);
  };

  const handleOpenNoteModal = (note = null) => {
    setEditNote(note);
    setAttachedFiles(note?.attachedFiles || []);
    setOpenNoteModal(true);
  };

  const handleCloseNoteModal = () => {
    setOpenNoteModal(false);
    setEditNote(null);
    setAttachedFiles([]);
  };

  const handleOpenGroupModal = (group = null) => {
    setEditGroup(group);
    setOpenGroupModal(true);
  };

  const handleCloseGroupModal = () => {
    setOpenGroupModal(false);
    setEditGroup(null);
  };

  const handleSaveNote = async () => {
    try {
      const noteData = {
        ...editNote,
        groupId: selectedGroup.id,
        attachedFiles: attachedFiles.join(','),
      };
      if (editNote?.id) {
        await axios.put(`http://localhost:5000/api/notes/${editNote.id}`, noteData);
      } else {
        await axios.post('http://localhost:5000/api/notes', noteData);
      }
      fetchNotes(selectedGroup.id);
      handleCloseNoteModal();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`http://localhost:5000/api/notes/${noteId}`);
      fetchNotes(selectedGroup.id);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleSaveGroup = async () => {
    try {
      if (editGroup?.id) {
        await axios.put(`http://localhost:5000/api/groups/${editGroup.id}`, editGroup);
      } else {
        await axios.post('http://localhost:5000/api/groups', editGroup);
      }
      fetchGroups();
      handleCloseGroupModal();
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await axios.delete(`http://localhost:5000/api/groups/${groupId}`);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleDrop = (acceptedFiles) => {
    setAttachedFiles([...attachedFiles, ...acceptedFiles.map(file => file.name)]);
  };

  const themeConfig = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  return (
    <ThemeProvider theme={themeConfig}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Notes Dashboard
          </Typography>
          <Switch checked={darkMode} onChange={handleThemeChange} color="default" />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
        <Grid container spacing={isSmallScreen ? 1 : 3} alignItems="center" justifyContent="center">
          {/* Groups Column */}
          <Grid item xs={12} md={3} style={{ position: 'relative' }}>
            <Typography variant="h6">Groups</Typography>
            <Paper elevation={3} style={{ padding: '1rem', height: isSmallScreen ? 'auto' : '70vh', overflow: 'auto' }}>
              <List>
                {groups.map(group => (
                  <ListItem button key={group.id} onClick={() => setSelectedGroup(group)}>
                    <ListItemText primary={group.name} />
                    <IconButton edge="end" onClick={() => handleOpenGroupModal(group)}><EditIcon /></IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteGroup(group.id)}><DeleteIcon /></IconButton>
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<NoteAddIcon />}
                onClick={() => handleOpenGroupModal()}
                style={{ marginTop: '1rem' }}
              >
                Add Group
              </Button>
            </Paper>
            {selectedGroup && (
              <ArrowForwardIcon style={{ position: 'absolute', right: '-24px', top: '50%', transform: 'translateY(-50%)' }} />
            )}
          </Grid>

          {/* Notes Column */}
          <Grid item xs={12} md={3} style={{ position: 'relative' }}>
            <Typography variant="h6">Notes</Typography>
            <Paper elevation={3} style={{ padding: '1rem', height: isSmallScreen ? 'auto' : '70vh', overflow: 'auto' }}>
              <List>
                {notes.map(note => (
                  <ListItem button key={note.id} onClick={() => setSelectedNote(note)}>
                    <ListItemText primary={note.title} />
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<NoteAddIcon />}
                onClick={() => handleOpenNoteModal()}
                style={{ marginTop: '1rem' }}
              >
                Add Note
              </Button>
            </Paper>
            {selectedNote && (
              <ArrowForwardIcon style={{ position: 'absolute', right: '-24px', top: '50%', transform: 'translateY(-50%)' }} />
            )}
          </Grid>

          {/* Selected Note Panel */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Note Details</Typography>
            <Paper elevation={3} style={{ padding: '1rem', height: isSmallScreen ? 'auto' : '70vh', overflow: 'auto' }}>
              {selectedNote ? (
                <div>
                  <Typography variant="h5" gutterBottom>{selectedNote.title}</Typography>
                  <Button onClick={() => handleOpenNoteModal(selectedNote)} color="primary" variant="outlined" startIcon={<EditIcon />}>Edit</Button>
                  <Button onClick={() => handleDeleteNote(selectedNote.id)} color="secondary" variant="outlined" startIcon={<DeleteIcon />} style={{ marginLeft: '1rem' }}>Delete</Button>
                  <Switch
                    checked={viewMode === 'render'}
                    onChange={() => setViewMode(viewMode === 'render' ? 'code' : 'render')}
                    color="default"
                    style={{ marginLeft: '1rem' }}
                  />
                  <Typography variant="body2" color="textSecondary">{viewMode === 'render' ? 'Render Mode' : 'Code Mode'}</Typography>
                  <div style={{ marginTop: '1rem' }}>
                    {viewMode === 'render' ? (
                      <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                    ) : (
                      <TextField
                        value={selectedNote.content}
                        fullWidth
                        multiline
                        rows={15}
                        variant="outlined"
                      />
                    )}
                  </div>
                  <Typography variant="h6" style={{ marginTop: '1rem' }}>Attached Files</Typography>
                  {selectedNote.attachedFiles.length > 0 ? (
                    selectedNote.attachedFiles.map((file, index) => (
                      <div key={index}>
                        <a href={file} target="_blank" rel="noopener noreferrer">{file}</a>
                      </div>
                    ))
                  ) : (
                    <Typography>No attached files</Typography>
                  )}
                </div>
              ) : (
                <Typography>Select a note to view details</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Note Modal */}
      <Dialog open={openNoteModal} onClose={handleCloseNoteModal} fullWidth maxWidth="sm">
        <DialogTitle>{editNote ? 'Edit Note' : 'Add New Note'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please fill out the form below to add or edit a note.
          </DialogContentText>
          <TextField
            label="Title"
            value={editNote?.title || ''}
            onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Content"
            value={editNote?.content || ''}
            onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
            multiline
            rows={4}
            fullWidth
            margin="normal"
          />
          <Dropzone onDrop={handleDrop} multiple>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()} style={{ border: '2px dashed #cccccc', padding: '1rem', marginTop: '1rem', textAlign: 'center', cursor: 'pointer' }}>
                <input {...getInputProps()} />
                <CloudUploadIcon />
                <Typography>Drag & drop files here, or click to select files</Typography>
              </div>
            )}
          </Dropzone>
          {attachedFiles.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <Typography variant="body1">Attached Files:</Typography>
              {attachedFiles.map((file, index) => (
                <Typography key={index}>{file}</Typography>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNoteModal} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveNote} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Modal */}
      <Dialog open={openGroupModal} onClose={handleCloseGroupModal} fullWidth maxWidth="sm">
        <DialogTitle>{editGroup ? 'Edit Group' : 'Add New Group'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please fill out the form below to add or edit a group.
          </DialogContentText>
          <TextField
            label="Group Name"
            value={editGroup?.name || ''}
            onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupModal} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveGroup} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
