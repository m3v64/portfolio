function initNotesApp() {
    if (initNotesApp._initialized) return;
    initNotesApp._initialized = true;

    const STORAGE_KEY = 'portfolio.notes';
    let notes = [];
    let currentNoteId = null;
    let editorVisible = false;

    function loadNotes() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            notes = stored ? JSON.parse(stored) : [];
            if (notes.length === 0) {
                notes.push({
                    id: Date.now(),
                    title: 'Welcome to Notes',
                    content: '# Welcome to Notes\n\nThis is a dynamic markdown note-taking app.\n\n## Features\n- **Bold** and *italic* text\n- [Links](https://example.com)\n- Images\n- Headers (H1-H6)\n\nStart editing to see the live preview!',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    locked: true,
                    pinned: true
                });
                saveNotes();
            }
        } catch (e) {
            console.error('Error loading notes:', e);
            notes = [];
        }
    }

    function saveNotes() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        } catch (e) {
            console.error('Error saving notes:', e);
        }
    }

    function getNoteTitle(content) {
        if (!content) return 'Untitled Note';
        const firstLine = content.split('\n')[0];
        let title = firstLine.replace(/^#+ /, '').trim();
        if (!title) {
            title = content.substring(0, 50).trim();
        }
        return title || 'Untitled Note';
    }

    function renderMarkdown(markdown) {
        try {
            const html = marked.parse(markdown || '');
            return DOMPurify.sanitize(html);
        } catch (e) {
            console.error('Error rendering markdown:', e);
            return '<p>Error rendering markdown</p>';
        }
    }

    function renderNotesList() {
        const explorer = document.querySelector('.notes-explorer');
        if (!explorer) return;

        explorer.innerHTML = '';
        
        const sortedNotes = [...notes].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            
            return new Date(b.created) - new Date(a.created);
        });
        
        sortedNotes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item glass';
            noteItem.textContent = note.title;
            noteItem.dataset.noteId = note.id;
            
            if (note.id === currentNoteId) {
                noteItem.classList.add('active');
            }
            
            noteItem.addEventListener('click', () => {
                loadNote(note.id);
            });
            
            explorer.appendChild(noteItem);
        });
    }

    function loadNote(noteId, showEditor = null) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        currentNoteId = noteId;
        
        const noteInput = document.querySelector('.note-input');
        const notePreview = document.querySelector('.note-preview');
        const semiDivider = document.querySelector('.notes-resizable-divider');
        
        if (!noteInput || !notePreview) return;
        const isLocked = note.locked === true;
        
        let shouldShowEditor;
        if (showEditor !== null) {
            shouldShowEditor = showEditor;
            editorVisible = showEditor;
        } else {
            shouldShowEditor = isLocked ? false : editorVisible;
        }
        
        if (isLocked && !shouldShowEditor) {
            noteInput.style.display = 'none';
            noteInput.setAttribute('inert', '');
            if (semiDivider) {
                semiDivider.style.display = 'none';
                semiDivider.setAttribute('inert', '');
            }

            notePreview.style.flex = '1 1 100%';
            notePreview.innerHTML = renderMarkdown(note.content);
            editorVisible = false;
        } else if (shouldShowEditor) {
            noteInput.style.display = 'block';
            noteInput.removeAttribute('inert');
            if (semiDivider) {
                semiDivider.style.display = 'block';
                semiDivider.removeAttribute('inert');
            }

            noteInput.style.flex = '1 1 50%';
            notePreview.style.flex = '1 1 50%';

            let textarea = noteInput.querySelector('textarea');
            if (!textarea) {
                textarea = document.createElement('textarea');
                textarea.className = 'note-textarea';
                textarea.placeholder = 'Start typing your note in markdown...';
                noteInput.appendChild(textarea);
            }
            
            textarea.value = note.content;
            notePreview.innerHTML = renderMarkdown(note.content);

            if (!isLocked) {
                textarea.removeEventListener('input', handleTextareaInput);
                textarea.addEventListener('input', handleTextareaInput);
                textarea.removeAttribute('readonly');
            } else {
                textarea.setAttribute('readonly', 'readonly');
            }
            editorVisible = true;
        } else {
            noteInput.style.display = 'none';
            noteInput.setAttribute('inert', '');
            if (semiDivider) {
                semiDivider.style.display = 'none';
                semiDivider.setAttribute('inert', '');
            }

            notePreview.style.flex = '1 1 100%';
            notePreview.innerHTML = renderMarkdown(note.content);
            editorVisible = false;
        }
        
        renderNotesList();
    }

    function handleTextareaInput(e) {
        const textarea = e.target;
        const content = textarea.value;
        
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            note.content = content;
            note.title = getNoteTitle(content);
            note.modified = new Date().toISOString();
            saveNotes();
            
            const notePreview = document.querySelector('.note-preview');
            if (notePreview) {
                notePreview.innerHTML = renderMarkdown(content);
            }
            
            renderNotesList();
        }
    }

    function insertAtCursor(textarea, before, after = '') {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        
        const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
        textarea.value = newText;

        const newCursorPos = start + before.length + selectedText.length + after.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();

        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function createNewNote() {
        const newNote = {
            id: Date.now(),
            title: 'New Note',
            content: '# New Note\n\nStart writing...',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            locked: false
        };
        
        notes.unshift(newNote);
        saveNotes();
        renderNotesList();
        loadNote(newNote.id, true);
    }

    function setupControls() {
        const newNoteBtn = document.querySelector('.new-notes-option');
        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', createNewNote);
        }

        const previewBtn = document.querySelector('.notes-preview-toggle');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                if (currentNoteId) {
                    const note = notes.find(n => n.id === currentNoteId);

                    if (note && !note.locked) {
                        loadNote(currentNoteId, !editorVisible);
                    } else if (note && note.locked) {
                        editorError('This note is locked and cannot be edited');
                    }
                }
            });
        }

        const textOptions = document.querySelector('.notes-text-options');
        if (textOptions) {
            const buttons = textOptions.querySelectorAll('img');

            if (buttons[0]) {
                buttons[0].addEventListener('click', (e) => {
                    if (editorVisible) showHeaderDropdown(e.target);
                    else editorError('Text formatting requires editor mode');
                });
            }

            if (buttons[1]) {
                buttons[1].addEventListener('click', (e) => {
                    if (editorVisible) showImageDropdown(e.target);
                    else editorError('Image insertion requires editor mode');
                });
            }

            if (buttons[2]) {
                buttons[2].addEventListener('click', (e) => {
                    if (editorVisible) showLinkDropdown(e.target);
                    else editorError('Link insertion requires editor mode');
                });
            }
        }

        const minimizeBtn = document.querySelector('.window-option-minimize');
        const maximizeBtn = document.querySelector('.window-option-maximize');
        const closeBtn = document.querySelector('.window-option-close');
        const notesWindow = document.querySelector('.notes-window');

        if (minimizeBtn && notesWindow) {
            minimizeBtn.addEventListener('click', () => {
                notesWindow.style.display = 'none';
            });
        }
        
        if (maximizeBtn && notesWindow) {
            let isMaximized = false;
            let previousStyles = {};

            const maximizeIcon = maximizeBtn.querySelector('img');
            const maximizeSrc = maximizeIcon?.getAttribute('src') || 'assets/svg/Maximize.svg';
            const restoreSrc = 'assets/svg/Restore.svg';

            function setMaximizeIcon(maximized) {
                if (!maximizeIcon) return;
                maximizeIcon.src = maximized ? restoreSrc : maximizeSrc;
                maximizeIcon.alt = maximized ? 'Restore' : 'Maximize';
            }
            setMaximizeIcon(false);
            
            maximizeBtn.addEventListener('click', () => {
                if (!isMaximized) {
                    previousStyles = {
                        width: notesWindow.style.width,
                        height: notesWindow.style.height,
                        top: notesWindow.style.top,
                        left: notesWindow.style.left,
                        transform: notesWindow.style.transform
                    };
                    
                    notesWindow.style.width = '100vw';
                    notesWindow.style.height = '100vh';
                    notesWindow.style.top = '0';
                    notesWindow.style.left = '0';
                    notesWindow.style.transform = 'none';
                    isMaximized = true;
                    setMaximizeIcon(true);
                } else {
                    Object.assign(notesWindow.style, previousStyles);
                    isMaximized = false;
                    setMaximizeIcon(false);
                }
            });
        }
        
        if (closeBtn && notesWindow) {
            closeBtn.addEventListener('click', () => {
                notesWindow.style.display = 'none';
            });
        }
        
        const notesIcon = document.querySelector('.taskbar-icon-1');
        if (notesIcon && notesWindow) {
            notesIcon.addEventListener('click', () => {
                notesWindow.style.display = 'flex';

                const nextZ = (initNotesApp._z = (initNotesApp._z ?? 30) + 1);
                notesWindow.style.zIndex = String(nextZ);
            });
        }
    }
    
    function makeWindowDraggable() {
        const dragHandle = document.querySelector('[data-drag-handle]');
        const notesWindow = document.querySelector('.notes-window');
        
        if (!dragHandle || !notesWindow) return;
        
        makeDraggable(notesWindow, dragHandle);
    }
    
    function makeWindowResizable() {
        const notesWindow = document.querySelector('.notes-window');
        if (!notesWindow) return;
        
        const corners = ['nw', 'ne', 'sw', 'se'];
        const minWidth = 400;
        const minHeight = 300;
        
        corners.forEach(corner => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${corner}`;
            
            notesWindow.appendChild(handle);
            
            let isResizing = false;
            let startX, startY, startWidth, startHeight, startLeft, startTop;
            
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isResizing = true;
                
                startX = e.clientX;
                startY = e.clientY;
                startWidth = notesWindow.offsetWidth;
                startHeight = notesWindow.offsetHeight;
                startLeft = notesWindow.offsetLeft;
                startTop = notesWindow.offsetTop;
                
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', stopResize);
            });
            
            function resize(e) {
                if (!isResizing) return;
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;
                
                if (corner.includes('e')) {
                    newWidth = Math.max(minWidth, startWidth + deltaX);
                } else if (corner.includes('w')) {
                    const proposedWidth = startWidth - deltaX;
                    newWidth = Math.max(minWidth, proposedWidth);
                    if (proposedWidth >= minWidth) newLeft = startLeft + deltaX;
                }
                
                if (corner.includes('s')) {
                    newHeight = Math.max(minHeight, startHeight + deltaY);
                } else if (corner.includes('n')) {
                    const proposedHeight = startHeight - deltaY;
                    newHeight = Math.max(minHeight, proposedHeight);
                    if (proposedHeight >= minHeight) newTop = startTop + deltaY;
                }
                
                notesWindow.style.width = `${newWidth}px`;
                notesWindow.style.height = `${newHeight}px`;
                notesWindow.style.left = `${newLeft}px`;
                notesWindow.style.top = `${newTop}px`;
                notesWindow.style.transform = 'none';
            }
            
            function stopResize() {
                isResizing = false;
                document.removeEventListener('mousemove', resize);
                document.removeEventListener('mouseup', stopResize);
            }
        });
        
        notesWindow.style.position = 'fixed';
    }
    
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Delete' && e.key !== 'Del') return;
            if (document.querySelector('.delete-overlay')) return;
            
            const notesWindow = document.querySelector('.notes-window');
            if (!notesWindow || notesWindow.style.display === 'none') return;
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
            if (!currentNoteId) return;
            
            const note = notes.find(n => n.id === currentNoteId);
            if (!note) return;
            
            if (note.locked) {
                editorError('Cannot delete locked notes');
                return;
            }

            showDeleteConfirmation(note);
            e.preventDefault();
        });
    }
    
    function showDeleteConfirmation(note) {
        const overlay = document.createElement('div');
        overlay.className = 'delete-overlay';

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        const closeDialog = () => {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        };

        const dialog = document.createElement('div');
        dialog.className = 'glass delete-dialog';

        const title = document.createElement('h2');
        title.className = 'delete-dialog-title';
        title.textContent = 'Delete Note?';
        
        const message = document.createElement('p');
        message.className = 'delete-dialog-message';
        message.textContent = `Are you sure you want to delete "${note.title}"? This action cannot be undone.`;
        
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'delete-dialog-buttons';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'delete-dialog-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', closeDialog);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-dialog-confirm';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            deleteNote(note.id);
            closeDialog();
        });
        
        buttonsDiv.appendChild(cancelBtn);
        buttonsDiv.appendChild(deleteBtn);
        dialog.appendChild(title);
        dialog.appendChild(message);
        dialog.appendChild(buttonsDiv);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeDialog();
        });
    }
    
    function deleteNote(noteId) {
        const index = notes.findIndex(n => n.id === noteId);
        if (index === -1) return;
        
        notes.splice(index, 1);
        saveNotes();
        
        if (notes.length > 0) {
            loadNote(notes[0].id);
        } else {
            const notePreview = document.querySelector('.note-preview');
            if (notePreview) notePreview.innerHTML = '';
        }
        
        renderNotesList();
    }

    function editorError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'editor-error-popup glass';
        
        let displayMessage = 'Editor is not available';
        if (typeof message === 'string') {
            displayMessage = message;
        } else {
            displayMessage = 'This action requires the editor to be open';
        }
        
        errorEl.textContent = displayMessage;
        
        document.body.appendChild(errorEl);
        
        setTimeout(() => {
            errorEl.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => errorEl.remove(), 300);
        }, 3000);
    }

    function showHeaderDropdown(button) {
        const textarea = document.querySelector('.note-textarea');
        if (!textarea) return;

        const dropdown = createDropdown([
            { label: 'Heading 1', action: () => insertAtCursor(textarea, '# ', '') },
            { label: 'Heading 2', action: () => insertAtCursor(textarea, '## ', '') },
            { label: 'Heading 3', action: () => insertAtCursor(textarea, '### ', '') },
            { label: 'Heading 4', action: () => insertAtCursor(textarea, '#### ', '') },
            { label: 'Heading 5', action: () => insertAtCursor(textarea, '##### ', '') },
            { label: 'Heading 6', action: () => insertAtCursor(textarea, '###### ', '') },
            { label: 'Bold', action: () => insertAtCursor(textarea, '**', '**') },
            { label: 'Italic', action: () => insertAtCursor(textarea, '*', '*') }
        ]);

        showDropdownAtElement(dropdown, button);
    }

    function showLinkDropdown(button) {
        const textarea = document.querySelector('.note-textarea');
        if (!textarea) return;

        const dropdown = createInputDropdown(
            'Insert Link',
            [
                { label: 'Text', placeholder: 'Link text', id: 'link-text' },
                { label: 'URL', placeholder: 'https://example.com', id: 'link-url' }
            ],
            (values) => {
                const text = values['link-text'] || 'link';
                const url = values['link-url'] || 'https://';
                insertAtCursor(textarea, `[${text}](${url})`, '');
            }
        );

        showDropdownAtElement(dropdown, button);
    }

    function showImageDropdown(button) {
        const textarea = document.querySelector('.note-textarea');
        if (!textarea) return;

        const dropdown = createInputDropdown(
            'Insert Image',
            [
                { label: 'Alt Text', placeholder: 'Image description', id: 'img-alt' },
                { label: 'URL', placeholder: 'https://example.com/image.jpg', id: 'img-url' }
            ],
            (values) => {
                const alt = values['img-alt'] || 'image';
                const url = values['img-url'] || 'https://';
                insertAtCursor(textarea, `![${alt}](${url})`, '');
            }
        );

        showDropdownAtElement(dropdown, button);
    }

    function createDropdown(items) {
        const dropdown = document.createElement('div');
        dropdown.className = 'notes-dropdown glass';
        
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'notes-dropdown-item';
            menuItem.textContent = item.label;
            menuItem.addEventListener('click', () => {
                item.action();
                dropdown.remove();
            });
            dropdown.appendChild(menuItem);
        });
        
        return dropdown;
    }

    function createInputDropdown(title, inputs, onSubmit) {
        const dropdown = document.createElement('div');
        dropdown.className = 'notes-dropdown glass notes-dropdown-form';
        
        const titleEl = document.createElement('div');
        titleEl.className = 'notes-dropdown-title';
        titleEl.textContent = title;
        dropdown.appendChild(titleEl);
        
        const values = {};
        
        inputs.forEach(input => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'notes-dropdown-input-group';
            
            const label = document.createElement('label');
            label.textContent = input.label;
            label.className = 'notes-dropdown-label';
            inputGroup.appendChild(label);
            
            const inputEl = document.createElement('input');
            inputEl.type = 'text';
            inputEl.placeholder = input.placeholder;
            inputEl.className = 'notes-dropdown-input';
            inputEl.id = input.id;
            inputGroup.appendChild(inputEl);
            
            dropdown.appendChild(inputGroup);
        });
        
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Insert';
        submitBtn.className = 'notes-dropdown-submit';
        submitBtn.addEventListener('click', () => {
            inputs.forEach(input => {
                const inputEl = dropdown.querySelector(`#${input.id}`);
                values[input.id] = inputEl.value;
            });
            onSubmit(values);
            dropdown.remove();
        });
        dropdown.appendChild(submitBtn);
        
        return dropdown;
    }

    function showDropdownAtElement(dropdown, element) {
        document.querySelectorAll('.notes-dropdown').forEach(d => d.remove());
        
        const rect = element.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.zIndex = '1000';
        
        document.body.appendChild(dropdown);

        setTimeout(() => {
            const closeHandler = (e) => {
                if (!dropdown.contains(e.target) && e.target !== element) {
                    dropdown.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 10);
    }

    function setupResizableDivider() {
        const divider = document.querySelector('.notes-resizable-divider');
        const noteInput = document.querySelector('.note-input');
        const notePreview = document.querySelector('.note-preview');
        
        if (!divider || !noteInput || !notePreview) return;
        
        let isDragging = false;
        let startX = 0;
        let startInputWidth = 0;
        let startPreviewWidth = 0;
        
        divider.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startInputWidth = noteInput.offsetWidth;
            startPreviewWidth = notePreview.offsetWidth;
            
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const containerWidth = noteInput.parentElement.offsetWidth - divider.offsetWidth;

            const newInputWidth = startInputWidth + deltaX;
            const newPreviewWidth = startPreviewWidth - deltaX;

            const minWidth = containerWidth * 0.2;
            
            if (newInputWidth >= minWidth && newPreviewWidth >= minWidth) {
                const inputPercent = (newInputWidth / containerWidth) * 100;
                const previewPercent = (newPreviewWidth / containerWidth) * 100;
                
                noteInput.style.flex = `1 1 ${inputPercent}%`;
                notePreview.style.flex = `1 1 ${previewPercent}%`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            }
        });
    }

    loadNotes();
    renderNotesList();

    if (notes.length > 0) {
        loadNote(notes[0].id);
    }

    setupControls();
    setupResizableDivider();
    makeWindowDraggable();
    makeWindowResizable();
    setupKeyboardShortcuts();
}
