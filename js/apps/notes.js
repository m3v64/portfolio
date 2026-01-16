function initNotesApp() {
    const STORAGE_KEY = 'portfolio.notes';
    let notes = [];
    let currentNoteId = null;
    let editorVisible = false;

    // Load notes from localStorage
    function loadNotes() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            notes = stored ? JSON.parse(stored) : [];
            if (notes.length === 0) {
                // Create default welcome note (locked and pinned)
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

    // Save notes to localStorage
    function saveNotes() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        } catch (e) {
            console.error('Error saving notes:', e);
        }
    }

    // Get note title from content (first line or first 50 chars)
    function getNoteTitle(content) {
        if (!content) return 'Untitled Note';
        const firstLine = content.split('\n')[0];
        let title = firstLine.replace(/^#+ /, '').trim();
        if (!title) {
            title = content.substring(0, 50).trim();
        }
        return title || 'Untitled Note';
    }

    // Render markdown to HTML
    function renderMarkdown(markdown) {
        try {
            const html = marked.parse(markdown || '');
            return DOMPurify.sanitize(html);
        } catch (e) {
            console.error('Error rendering markdown:', e);
            return '<p>Error rendering markdown</p>';
        }
    }

    // Render notes list in explorer
    function renderNotesList() {
        const explorer = document.querySelector('.notes-explorer');
        if (!explorer) return;

        explorer.innerHTML = '';
        
        // Sort notes: pinned notes first, then by creation date (newest first)
        const sortedNotes = [...notes].sort((a, b) => {
            // Pinned notes always come first
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            
            // For non-pinned notes, sort by creation date (newest first)
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

    // Load and display a note
    function loadNote(noteId, showEditor = null) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        currentNoteId = noteId;
        
        const noteInput = document.querySelector('.note-input');
        const notePreview = document.querySelector('.note-preview');
        const semiDivider = document.querySelector('.notes-resizable-divider');
        
        if (!noteInput || !notePreview) return;

        // Check if note is locked
        const isLocked = note.locked === true;
        
        // Determine if editor should be shown
        // If showEditor is explicitly set, use that
        // If null, use current editorVisible state for unlocked notes, false for locked
        let shouldShowEditor;
        if (showEditor !== null) {
            shouldShowEditor = showEditor;
            editorVisible = showEditor; // Update state
        } else {
            shouldShowEditor = isLocked ? false : editorVisible;
        }
        
        // For locked notes, only show preview unless explicitly requested
        if (isLocked && !shouldShowEditor) {
            // Hide editor and divider, show only preview
            noteInput.style.display = 'none';
            noteInput.setAttribute('inert', '');
            if (semiDivider) {
                semiDivider.style.display = 'none';
                semiDivider.setAttribute('inert', '');
            }
            
            // Show preview full width
            notePreview.style.flex = '1 1 100%';
            notePreview.innerHTML = renderMarkdown(note.content);
            editorVisible = false;
        } else if (shouldShowEditor) {
            // Show editor and preview
            noteInput.style.display = 'block';
            noteInput.removeAttribute('inert');
            if (semiDivider) {
                semiDivider.style.display = 'block';
                semiDivider.removeAttribute('inert');
            }
            
            // Reset flex to default split view
            noteInput.style.flex = '1 1 50%';
            notePreview.style.flex = '1 1 50%';
            
            // Create or get textarea
            let textarea = noteInput.querySelector('textarea');
            if (!textarea) {
                textarea = document.createElement('textarea');
                textarea.className = 'note-textarea';
                textarea.placeholder = 'Start typing your note in markdown...';
                noteInput.appendChild(textarea);
            }
            
            textarea.value = note.content;
            notePreview.innerHTML = renderMarkdown(note.content);
            
            // Update preview on input (only for unlocked notes)
            if (!isLocked) {
                textarea.removeEventListener('input', handleTextareaInput);
                textarea.addEventListener('input', handleTextareaInput);
                textarea.removeAttribute('readonly');
            } else {
                // Make textarea read-only for locked notes
                textarea.setAttribute('readonly', 'readonly');
            }
            editorVisible = true;
        } else {
            // Show only preview (for unlocked notes when editor is hidden)
            noteInput.style.display = 'none';
            noteInput.setAttribute('inert', '');
            if (semiDivider) {
                semiDivider.style.display = 'none';
                semiDivider.setAttribute('inert', '');
            }
            
            // Show preview full width
            notePreview.style.flex = '1 1 100%';
            notePreview.innerHTML = renderMarkdown(note.content);
            editorVisible = false;
        }
        
        renderNotesList();
    }

    // Handle textarea input
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

    // Insert text at cursor position
    function insertAtCursor(textarea, before, after = '') {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        
        const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
        textarea.value = newText;
        
        // Set cursor position
        const newCursorPos = start + before.length + selectedText.length + after.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
        
        // Trigger input event
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Create new note
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
        loadNote(newNote.id, true); // Show editor for new notes
    }

    // Setup UI controls
    function setupControls() {
        // New note button
        const newNoteBtn = document.querySelector('.new-notes-option');
        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', createNewNote);
        }

        // Preview toggle button
        const previewBtn = document.querySelector('.notes-preview-toggle');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                if (currentNoteId) {
                    const note = notes.find(n => n.id === currentNoteId);
                    
                    // Don't allow opening editor for locked notes
                    if (note && !note.locked) {
                        loadNote(currentNoteId, !editorVisible);
                    }
                }
            });
        }

        // Text formatting controls
        const textOptions = document.querySelector('.notes-text-options');
        if (textOptions) {
            const buttons = textOptions.querySelectorAll('img');
            
            // Text/Header dropdown button
            if (buttons[0]) {
                buttons[0].addEventListener('click', (e) => {
                    if (editorVisible) showHeaderDropdown(e.target);
                    else editorError('That option');
                });
            }
            
            // Image button
            if (buttons[1]) {
                buttons[1].addEventListener('click', (e) => {
                    if (editorVisible) showImageDropdown(e.target);
                    else editorError(e.target);
                });
            }
            
            // Link button
            if (buttons[2]) {
                buttons[2].addEventListener('click', (e) => {
                    if (editorVisible) showLinkDropdown(e.target);
                    else editorError(e.target);
                });
            }
        }

        // Window controls
        const minimizeBtn = document.querySelector('.window-option-minimize');
        const maximizeBtn = document.querySelector('.window-option-maximize');
        const closeBtn = document.querySelector('.window-option-close');
        const notesWindow = document.querySelector('.notes-window');
        
        if (closeBtn && notesWindow) {
            closeBtn.addEventListener('click', () => {
                notesWindow.style.display = 'none';
            });
        }
        
        // Taskbar icon to show notes
        const notesIcon = document.querySelector('.taskbar-icon-1');
        if (notesIcon && notesWindow) {
            notesIcon.addEventListener('click', () => {
                notesWindow.style.display = notesWindow.style.display === 'none' ? 'flex' : 'none';
            });
        }
    }

    function editorError(content) {
        const warnEl = document.createElement('div');
        warnEl.className = 'editor-error-pop-up notes-dropdown-title glass flex center';

        const warnContent = document.createElement('div');
        warnContent.textContent = content;
        warnEl.appendChild(warnContent);

        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Insert';
        submitBtn.className = 'notes-dropdown-submit';
        submitBtn.addEventListener('click', () => {
            inputs.forEach(input => {
                const inputEl = warnEl.querySelector(`#${input.id}`);
                values[input.id] = inputEl.value;
            });
            onSubmit(values);
            warnEl.remove();
        });
        warnEl.appendChild(submitBtn);
        
        return warnEl;
    }

    // Show header dropdown
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

    // Show link dropdown
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

    // Show image dropdown
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

    // Create dropdown menu
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

    // Create input dropdown
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

    // Show dropdown at element position
    function showDropdownAtElement(dropdown, element) {
        // Remove any existing dropdowns
        document.querySelectorAll('.notes-dropdown').forEach(d => d.remove());
        
        const rect = element.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.zIndex = '1000';
        
        document.body.appendChild(dropdown);
        
        // Close on click outside
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

    // Make divider draggable for resizing
    // Make divider draggable for resizing (notes-specific)
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
            
            // Prevent text selection while dragging
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const containerWidth = noteInput.parentElement.offsetWidth - divider.offsetWidth;
            
            // Calculate new widths
            const newInputWidth = startInputWidth + deltaX;
            const newPreviewWidth = startPreviewWidth - deltaX;
            
            // Set minimum widths (20% of container)
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

    // Initialize
    loadNotes();
    renderNotesList();
    if (notes.length > 0) {
        loadNote(notes[0].id);
    }
    setupControls();
    setupResizableDivider();
}
