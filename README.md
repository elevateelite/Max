<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supabase Chat Application</title>
    <!-- Tailwind CSS CDN for quick styling -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Supabase JS Client -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body class="bg-gray-100 h-screen flex flex-col justify-between font-sans">

    <!-- Header / Presence Bar -->
    <header class="bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <div>
            <h1 class="text-xl font-bold text-gray-800">Group Chat</h1>
            <p id="presence-count" class="text-sm text-gray-500">0 users online</p>
        </div>
        <div id="auth-controls">
            <button id="login-btn" onclick="loginWithGoogle()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Login with Google</button>
            <button id="logout-btn" onclick="logout()" class="hidden bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Logout</button>
        </div>
    </header>

    <!-- Chat Messages Container -->
    <main id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4">
        <p class="text-center text-gray-400">Loading messages...</p>
    </main>

    <!-- Typing Indicator -->
    <div id="typing-indicator" class="px-4 text-xs italic text-gray-500 h-4"></div>

    <!-- Edit/Reply Banners -->
    <div id="action-banner" class="hidden bg-gray-200 px-4 py-2 border-t flex justify-between items-center text-sm text-gray-700">
        <span id="banner-text">Editing message...</span>
        <button onclick="cancelAction()" class="text-red-500 font-bold hover:underline">Cancel</button>
    </div>

    <!-- Message Input Form -->
    <footer class="bg-white border-t p-4">
        <!-- File Preview -->
        <div id="file-preview" class="hidden text-xs text-blue-600 mb-2 flex items-center gap-2">
            <span id="file-name">filename.png</span>
            <button onclick="clearFile()" class="text-red-500 font-bold">✕</button>
        </div>

        <form id="chat-form" class="flex items-end gap-2">
            <label class="cursor-pointer bg-gray-100 p-2 rounded-lg hover:bg-gray-200">
                📎
                <input type="file" id="file-input" class="hidden" onchange="handleFileSelect(event)">
            </label>
            <textarea id="message-input" rows="1" placeholder="Type a message..." class="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"></textarea>
            <button type="submit" class="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium">Send</button>
        </form>
    </footer>

    <!-- App Logic -->
    <script>
        // REPLACE WITH YOUR SUPABASE CREDENTIALS
        const SUPABASE_URL = 'YOUR_SUPABASE_URL';
        const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

        const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // State variables
        let currentUser = null;
        let userRole = 'student';
        let roomChannel = null;
        let editingMessageId = null;
        let replyingToMessage = null;
        let selectedFile = null;
        let allSessionMessages = [];

        // DOM Elements
        const chatMessages = document.getElementById('chat-messages');
        const chatForm = document.getElementById('chat-form');
        const messageInput = document.getElementById('message-input');
        const fileInput = document.getElementById('file-input');
        const filePreview = document.getElementById('file-preview');
        const fileNameSpan = document.getElementById('file-name');
        const typingIndicator = document.getElementById('typing-indicator');
        const actionBanner = document.getElementById('action-banner');
        const bannerText = document.getElementById('banner-text');

        // Initialize App
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            currentUser = user;

            if (currentUser) {
                document.getElementById('login-btn').classList.add('hidden');
                document.getElementById('logout-btn').classList.remove('hidden');
                setupRealtimeChannel();
                await loadMessages();
            } else {
                chatMessages.innerHTML = '<p class="text-center text-gray-400">Please log in to view and send messages.</p>';
            }

            // Auto-resize textarea
            messageInput.addEventListener('input', adjustTextareaHeight);
        }

        // OAuth Login / Logout
        async function loginWithGoogle() {
            await supabase.auth.signInWithOAuth({ provider: 'google' });
        }

        async function logout() {
            await supabase.auth.signOut();
            window.location.reload();
        }

        // Fetch Messages from Database with Error Diagnostics
        async function loadMessages() {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(200);

            if (error) {
                console.error('Error loading messages from Supabase:', error.message);
                chatMessages.innerHTML = `<p class="text-center text-red-500">Failed to load messages: ${error.message}</p>`;
                return;
            }

            if (data) {
                chatMessages.innerHTML = ''; 
                allSessionMessages = [];
                data.forEach(msg => renderOrUpdateMessage(msg, false));
                scrollToBottom(true);
            }
        }

        // Render Message to UI
        function renderOrUpdateMessage(msg, isNew = false) {
            let existingMsgIndex = allSessionMessages.findIndex(m => m.id === msg.id);
            
            if (existingMsgIndex !== -1) {
                allSessionMessages[existingMsgIndex] = msg;
                const existingElem = document.getElementById(`msg-${msg.id}`);
                if (existingElem) existingElem.outerHTML = buildMessageHTML(msg);
                return;
            }

            allSessionMessages.push(msg);
            chatMessages.insertAdjacentHTML('beforeend', buildMessageHTML(msg));
            if (isNew) scrollToBottom();
        }

        function buildMessageHTML(msg) {
            const isSelf = currentUser && currentUser.id === msg.user_id;
            return `
                <div id="msg-${msg.id}" class="flex flex-col ${isSelf ? 'items-end' : 'items-start'} my-2">
                    <span class="text-xs text-gray-400 mb-1">${msg.user_email || 'User'}</span>
                    <div class="max-w-md ${isSelf ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} p-3 rounded-xl shadow-sm border border-gray-100">
                        ${msg.reply_to_content ? `<div class="text-xs opacity-75 border-l-2 pl-2 mb-1 italic">Replying to: ${msg.reply_to_content}</div>` : ''}
                        <p class="whitespace-pre-wrap text-sm">${msg.content || ''}</p>
                        ${msg.file_url ? `<a href="${msg.file_url}" target="_blank" class="text-xs underline block mt-2 opacity-90">View Attachment</a>` : ''}
                        ${msg.is_edited ? `<span class="text-[10px] opacity-60 block mt-1">(edited)</span>` : ''}
                    </div>
                    ${isSelf ? `<button onclick="startEdit('${msg.id}', '${msg.content}')" class="text-[10px] text-gray-400 hover:underline mt-1">Edit</button>` : ''}
                </div>
            `;
        }

        // Submit Form Handler (Handles Inserts, Edits, File Uploads, & Broadcast)
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) return alert('Please login first!');

            const content = messageInput.value.trim();
            if (!content && !selectedFile && !editingMessageId) return;

            // EDIT MODE
            if (editingMessageId) {
                const { data: updatedMsg, error: updateErr } = await supabase.from('messages').update({
                    content: content,
                    is_edited: true
                }).eq('id', editingMessageId).select().single();

                if (updateErr) {
                    alert('Failed to update message: ' + updateErr.message);
                    return;
                }

                if (updatedMsg && roomChannel) {
                    roomChannel.send({ type: 'broadcast', event: 'new_message', payload: updatedMsg });
                }

                cancelAction();
                return;
            }

            // NEW MESSAGE MODE
            messageInput.value = '';
            adjustTextareaHeight();
            filePreview.classList.add('hidden');
            const fileToUpload = selectedFile;
            selectedFile = null;
            fileInput.value = '';

            let file_url = null;

            if (fileToUpload) {
                const fileExt = fileToUpload.name.split('.').pop();
                const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('chat-files').upload(filePath, fileToUpload);

                if (uploadError) {
                    alert('File storage upload failed: ' + uploadError.message);
                    return;
                } else {
                    const { data } = supabase.storage.from('chat-files').getPublicUrl(filePath);
                    file_url = data.publicUrl;
                }
            }

            const messageData = {
                user_id: currentUser.id,
                user_email: currentUser.email,
                user_role: userRole,
                content: content,
                file_url: file_url,
                reactions: {}
            };

            if (replyingToMessage) {
                messageData.reply_to_id = replyingToMessage.id;
                messageData.reply_to_email = replyingToMessage.email;
                messageData.reply_to_content = replyingToMessage.content;
            }

            cancelAction();

            // Insert into Supabase with explicit error check
            const { data: insertedMsg, error: insertError } = await supabase
                .from('messages')
                .insert([messageData])
                .select()
                .single();
            
            if (insertError) {
                console.error('Database Insert Error:', insertError);
                alert('Message could not be saved to database: ' + insertError.message);
                return;
            }

            if (insertedMsg) {
                renderOrUpdateMessage(insertedMsg, true);
                
                if (roomChannel) {
                    roomChannel.send({
                        type: 'broadcast',
                        event: 'new_message',
                        payload: insertedMsg
                    });
                }
            }
        });

        // Realtime Subscriptions & Presence
        function setupRealtimeChannel() {
            roomChannel = supabase.channel('room-1', {
                config: { presence: { key: currentUser.id } }
            });

            roomChannel
                .on('broadcast', { event: 'new_message' }, payload => {
                    renderOrUpdateMessage(payload.payload, true);
                })
                .on('presence', { event: 'sync' }, () => {
                    const state = roomChannel.presenceState();
                    const count = Object.keys(state).length;
                    document.getElementById('presence-count').innerText = `${count} online`;
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await roomChannel.track({ email: currentUser.email, online_at: new Date() });
                    }
                });
        }

        // Helpers & UI State Management
        function handleFileSelect(e) {
            selectedFile = e.target.files[0];
            if (selectedFile) {
                fileNameSpan.innerText = selectedFile.name;
                filePreview.classList.remove('hidden');
            }
        }

        function clearFile() {
            selectedFile = null;
            fileInput.value = '';
            filePreview.classList.add('hidden');
        }

        function startEdit(id, content) {
            editingMessageId = id;
            messageInput.value = content;
            bannerText.innerText = 'Editing message...';
            actionBanner.classList.remove('hidden');
            messageInput.focus();
        }

        function cancelAction() {
            editingMessageId = null;
            replyingToMessage = null;
            messageInput.value = '';
            actionBanner.classList.add('hidden');
            adjustTextareaHeight();
        }

        function scrollToBottom(smooth = false) {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }

        function adjustTextareaHeight() {
            messageInput.style.height = 'auto';
            messageInput.style.height = messageInput.scrollHeight + 'px';
        }

        // Launch
        init();
    </script>
</body>
</html>
