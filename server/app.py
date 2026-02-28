import shutil
import requests
import re
import os
import json
import base64
import secrets
from functools import wraps
from flask import Flask, jsonify, request, send_from_directory, render_template_string, session, redirect, url_for
from flask_cors import CORS
import werkzeug.utils

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

# 加载配置文件
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, 'config.json')
BIN_DIR = os.path.join(BASE_DIR, 'bin')

if not os.path.exists(BIN_DIR):
    os.makedirs(BIN_DIR)

def load_config():
    default_config = {
        "users": {
            "admin": {
                "password": "admin123",
                "token": secrets.token_hex(16)
            }
        }
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                data = json.load(f)
                # 迁移旧配置格式
                if "username" in data:
                    token = secrets.token_hex(16)
                    new_config = {
                        "users": {
                            data["username"]: {
                                "password": data.get("password", "password"),
                                "token": token
                            }
                        }
                    }
                    save_config(new_config)
                    return new_config
                return data
        except Exception:
            return default_config
    else:
        # 如果文件不存在，保存默认配置
        save_config(default_config)
    return default_config

def save_config(config_data):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config_data, f, indent=4)

config = load_config()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_user_bin_dir(username):
    user_dir = os.path.join(BIN_DIR, username)
    if not os.path.exists(user_dir):
        os.makedirs(user_dir)
    return user_dir

def safe_path_with_username(username, bin_param):
    # 过滤危险字符，拼接安全路径
    filename = f"{bin_param}.bin"
    safe_filename = werkzeug.utils.secure_filename(filename)
    return os.path.join(get_user_bin_dir(username), safe_filename)

def extract_target_chars(text):
    # 保留字母(a-zA-Z)、数字(0-9)及特定符号(+=?/)
    pattern = r'[^a-zA-Z0-9+=?/]'
    return re.sub(pattern, '', text)

ALLOWED_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bin')  # 限制文件读取目录
if not os.path.exists(ALLOWED_DIR):
    os.makedirs(ALLOWED_DIR)

def safe_path(bin_param):
    # 过滤危险字符，拼接安全路径
    filename = f"{bin_param}.bin"
    safe_filename = os.path.basename(filename)  # 防止路径遍历
    return os.path.join(ALLOWED_DIR, safe_filename)
    
def extract_token_content(result_str):
    # 查找'token'的位置（注意大小写）
    token_start = result_str.find('Token')
    if token_start == -1:
        return "未找到'Token'关键词"
   
    # 查找'roleId'的位置（注意大小写）
    roleid_start = result_str.find('roleId')
    if roleid_start == -1:
        return "未找到'roleId'关键词"
   
    # 计算token结束位置（跳过'token'本身）
    token_end = token_start + len('Token')
   
    # 提取token到roleId之间的内容
    if token_end >= roleid_start:
        return "token和roleId位置重叠或顺序不正确"
    extracted_content = result_str[token_end:roleid_start]
    return extracted_content

def encode_to_base64(input_string):
    # 将字符串转换为bytes
    input_bytes = input_string.encode('utf-8')
    
    # 进行Base64编码
    encoded_bytes = base64.b64encode(input_bytes)
    
    # 将编码后的bytes转换回字符串
    encoded_string = encoded_bytes.decode('utf-8')
    return encoded_string

def decode_from_base64(encoded_string):
    encoded_bytes = encoded_string.encode('utf-8')
    decoded_bytes = base64.b64decode(encoded_bytes)
    decoded_string = decoded_bytes.decode('utf-8')
    return decoded_string


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        # 重新加载配置
        current_config = load_config()
        users = current_config.get('users', {})
        
        if username in users and users[username]['password'] == password:
            session['logged_in'] = True
            session['username'] = username
            return redirect(url_for('index'))
        else:
            error = '无效的凭证'
    
    return render_template_string('''
<!DOCTYPE html>
<html>
<head>
    <title>登录</title>
    <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f4f4f4; margin: 0; }
        .login-container { background: white; padding: 30px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); width: 300px; }
        input { display: block; margin: 10px 0; padding: 10px; width: 100%; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box; }
        button { width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; margin-top: 10px; }
        button.secondary { background-color: #6c757d; }
        button:hover { opacity: 0.9; }
        .error { color: red; margin-bottom: 10px; font-size: 0.9em; text-align: center; }
        h2 { text-align: center; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="login-container">
        <h2>登录</h2>
        {% if error %}
        <div class="error">{{ error }}</div>
        {% endif %}
        <form method="post">
            <input type="text" name="username" placeholder="用户名" required>
            <input type="password" name="password" placeholder="密码" required>
            <button type="submit">登录</button>
        </form>
        <button class="secondary" onclick="window.location.href='/register'">注册新账号</button>
    </div>
</body>
</html>
    ''', error=error)

@app.route('/register', methods=['GET', 'POST'])
def register():
    error = None
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if not username or not password:
            error = '用户名和密码不能为空'
        else:
            current_config = load_config()
            users = current_config.get('users', {})
            
            if username in users:
                error = '用户名已存在'
            else:
                # 创建新用户
                users[username] = {
                    "password": password,
                    "token": secrets.token_hex(16)
                }
                current_config['users'] = users
                save_config(current_config)
                
                # 创建用户目录
                get_user_bin_dir(username)
                
                return redirect(url_for('login'))
    
    return render_template_string('''
<!DOCTYPE html>
<html>
<head>
    <title>注册</title>
    <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f4f4f4; margin: 0; }
        .login-container { background: white; padding: 30px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); width: 300px; }
        input { display: block; margin: 10px 0; padding: 10px; width: 100%; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box; }
        button { width: 100%; padding: 10px; background-color: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; margin-top: 10px; }
        button.secondary { background-color: #6c757d; }
        button:hover { opacity: 0.9; }
        .error { color: red; margin-bottom: 10px; font-size: 0.9em; text-align: center; }
        h2 { text-align: center; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="login-container">
        <h2>注册新账号</h2>
        {% if error %}
        <div class="error">{{ error }}</div>
        {% endif %}
        <form method="post">
            <input type="text" name="username" placeholder="用户名" required>
            <input type="password" name="password" placeholder="密码" required>
            <button type="submit">注册</button>
        </form>
        <button class="secondary" onclick="window.location.href='/login'">返回登录</button>
    </div>
</body>
</html>
    ''', error=error)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('username', None)
    return redirect(url_for('login'))

@app.route('/delete_account', methods=['POST'])
@login_required
def delete_account():
    username = session.get('username')
    
    # 防止删除管理员账号
    if username == 'admin':
        return jsonify({"error": "无法删除管理员账号"}), 403
    
    # 删除用户数据
    current_config = load_config()
    if username in current_config['users']:
        del current_config['users'][username]
        save_config(current_config)
    
    # 删除用户目录
    user_dir = get_user_bin_dir(username)
    if os.path.exists(user_dir):
        try:
            shutil.rmtree(user_dir)
        except Exception as e:
            return jsonify({"error": f"删除文件失败: {str(e)}"}), 500
            
    # 登出
    session.pop('logged_in', None)
    session.pop('username', None)
    
    return jsonify({"message": "账号已删除"})

@app.route('/change_password', methods=['POST'])
@login_required
def change_password():
    username = session.get('username')
    data = request.get_json()
    
    if not data or 'new_password' not in data:
        return jsonify({"error": "新密码不能为空"}), 400
        
    new_password = data['new_password']
    
    current_config = load_config()
    if username in current_config['users']:
        current_config['users'][username]['password'] = new_password
        save_config(current_config)
        return jsonify({"message": "密码修改成功"})
    
    return jsonify({"error": "用户不存在"}), 404

@app.route('/')
@login_required
def index():
    return render_template_string('''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token URL & Bin 文件管理</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { text-align: center; }
        .header-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .upload-section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; }
        button { cursor: pointer; padding: 5px 10px; background-color: #007bff; color: white; border: none; border-radius: 3px; }
        button.delete { background-color: #dc3545; }
        button:hover { opacity: 0.8; }
        .url-cell { word-break: break-all; font-family: monospace; font-size: 0.9em; }
        .copy-btn { margin-left: 5px; background-color: #28a745; font-size: 0.8em; }
        .logout-btn { background-color: #6c757d; }
        .delete-account-btn { background-color: #dc3545; margin-right: 10px; }
        .change-password-btn { background-color: #ffc107; color: black; margin-right: 10px; }
        
        /* Modal Styles */
        .modal { display: none; position: fixed; z-index: 1; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); }
        .modal-content { background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 300px; border-radius: 5px; }
        .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close:hover, .close:focus { color: black; text-decoration: none; cursor: pointer; }
        .modal input { width: 100%; padding: 10px; margin: 10px 0; display: inline-block; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        .modal button { width: 100%; background-color: #4CAF50; color: white; padding: 14px 20px; margin: 8px 0; border: none; border-radius: 4px; cursor: pointer; }
        .modal button:hover { background-color: #45a049; }
    </style>
</head>
<body>
    <div class="header-controls">
        <div>
            <span>欢迎, {{ session['username'] }}</span>
        </div>
        <div>
            <button class="change-password-btn" onclick="openPasswordModal()">修改密码</button>
            {% if session['username'] != 'admin' %}
            <button class="delete-account-btn" onclick="deleteAccount()">注销账号</button>
            {% endif %}
            <button class="logout-btn" onclick="window.location.href='/logout'">退出登录</button>
        </div>
    </div>
    <h1>Token URL & Bin 文件管理</h1>
    
    <div class="upload-section">
        <h3>批量上传 bin 文件</h3>
        <input type="file" id="fileInput" accept=".bin" multiple>
        <button onclick="uploadFile()">上传</button>
    </div>

    <table id="fileTable">
        <thead>
            <tr>
                <th>文件名</th>
                <th>Token URL</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            <!-- 文件列表将在这里生成 -->
        </tbody>
    </table>

    <!-- Password Change Modal -->
    <div id="passwordModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closePasswordModal()">&times;</span>
            <h3>修改密码</h3>
            <input type="password" id="newPassword" placeholder="输入新密码">
            <button onclick="changePassword()">确认修改</button>
        </div>
    </div>

    <script>
        const API_BASE = '';

        function openPasswordModal() {
            document.getElementById('passwordModal').style.display = "block";
        }

        function closePasswordModal() {
            document.getElementById('passwordModal').style.display = "none";
            document.getElementById('newPassword').value = "";
        }

        window.onclick = function(event) {
            if (event.target == document.getElementById('passwordModal')) {
                closePasswordModal();
            }
        }

        async function changePassword() {
            const newPassword = document.getElementById('newPassword').value;
            if (!newPassword) {
                alert("请输入新密码");
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/change_password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ new_password: newPassword })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert(result.message);
                    closePasswordModal();
                } else {
                    alert('修改失败: ' + (result.error || '未知错误'));
                }
            } catch (error) {
                console.error('修改失败:', error);
                alert('修改出错');
            }
        }

        async function deleteAccount() {
            if (!confirm('确定要注销账号吗？此操作将永久删除您的账号及所有上传的文件，且不可恢复！')) return;
            
            try {
                const response = await fetch(`${API_BASE}/delete_account`, {
                    method: 'POST'
                });
                
                if (response.ok) {
                    alert('账号已注销');
                    window.location.href = '/login';
                } else {
                    const result = await response.json();
                    alert('注销失败: ' + (result.error || '未知错误'));
                }
            } catch (error) {
                console.error('注销失败:', error);
                alert('注销出错');
            }
        }

        async function loadFiles() {
            try {
                const response = await fetch(`${API_BASE}/api/files`);
                if (response.status === 401 || response.url.includes('/login')) {
                    window.location.href = '/login';
                    return;
                }
                const files = await response.json();
                const tbody = document.querySelector('#fileTable tbody');
                tbody.innerHTML = '';
                
                files.forEach(file => {
                    const tr = document.createElement('tr');
                    
                    const fullUrl = `${window.location.origin}${file.url}`;
                    
                    tr.innerHTML = `
                        <td>${file.filename}</td>
                        <td class="url-cell">
                            <a href="${file.url}" target="_blank">${file.url}</a>
                            <button class="copy-btn" onclick="copyToClipboard('${fullUrl}')">复制完整链接</button>
                        </td>
                        <td>
                            <button class="delete" onclick="deleteFile('${file.filename}')">删除</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (error) {
                console.error('加载文件失败:', error);
                // alert('加载文件列表失败');
            }
        }

        async function uploadFile() {
            const fileInput = document.getElementById('fileInput');
            const files = fileInput.files;
            if (files.length === 0) {
                alert('请选择至少一个文件');
                return;
            }
            
            const formData = new FormData();
            let validCount = 0;
            for (let i = 0; i < files.length; i++) {
                if (files[i].name.endsWith('.bin')) {
                    formData.append('files', files[i]);
                    validCount++;
                }
            }
            
            if (validCount === 0) {
                alert('只能上传 .bin 文件');
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                
                if (response.ok) {
                    alert(`成功上传 ${result.uploaded_count} 个文件`);
                    fileInput.value = '';
                    loadFiles();
                } else {
                    if (response.status === 401) window.location.href = '/login';
                    else alert('上传失败: ' + (result.error || '未知错误'));
                }
            } catch (error) {
                console.error('上传失败:', error);
                alert('上传出错');
            }
        }

        async function deleteFile(filename) {
            if (!confirm(`确定要删除 ${filename} 吗？`)) return;

            try {
                const response = await fetch(`${API_BASE}/api/files/${filename}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadFiles();
                } else {
                    if (response.status === 401) window.location.href = '/login';
                    else {
                        const result = await response.json();
                        alert('删除失败: ' + (result.error || '未知错误'));
                    }
                }
            } catch (error) {
                console.error('删除失败:', error);
                alert('删除出错');
            }
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('链接已复制到剪贴板');
            }).catch(err => {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制');
            });
        }

        // 页面加载时获取文件列表
        loadFiles();
    </script>
</body>
</html>
    ''')

@app.route('/api/files', methods=['GET'])
@login_required
def list_files():
    files = []
    username = session.get('username')
    user_dir = get_user_bin_dir(username)
    current_config = load_config()
    user_token = current_config['users'][username]['token']
    
    try:
        for filename in os.listdir(user_dir):
            if filename.endswith('.bin'):
                name_no_ext = os.path.splitext(filename)[0]
                encoded_key = encode_to_base64(name_no_ext)
                files.append({
                    "filename": filename,
                    "name": name_no_ext,
                    "url": f"/{user_token}/{name_no_ext}/{encoded_key}"
                })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(files)

@app.route('/api/upload', methods=['POST'])
@login_required
def upload_file():
    if 'files' not in request.files:
        return jsonify({"error": "未找到文件部分"}), 400
    
    files = request.files.getlist('files')
    if not files or files[0].filename == '':
        return jsonify({"error": "未选择文件"}), 400
        
    username = session.get('username')
    user_dir = get_user_bin_dir(username)
    uploaded_count = 0
    
    for file in files:
        if file and file.filename.endswith('.bin'):
            filename = werkzeug.utils.secure_filename(file.filename)
            file.save(os.path.join(user_dir, filename))
            uploaded_count += 1
            
    if uploaded_count > 0:
        return jsonify({"message": "文件上传成功", "uploaded_count": uploaded_count})
    
    return jsonify({"error": "没有有效的 bin 文件上传"}), 400

@app.route('/api/files/<filename>', methods=['DELETE'])
@login_required
def delete_file(filename):
    if not filename.endswith('.bin'):
        return jsonify({"error": "无效的文件名"}), 400
    
    username = session.get('username')
    user_dir = get_user_bin_dir(username)
    safe_filename = werkzeug.utils.secure_filename(filename)
    file_path = os.path.join(user_dir, safe_filename)
    
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return jsonify({"message": "文件删除成功"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "文件未找到"}), 404

@app.route('/<string:token>/<string:bin_param>/<string:key>')
def home(token, bin_param, key):
    # 验证 token
    current_config = load_config()
    users = current_config.get('users', {})
    
    # 查找 token 对应的用户
    valid_user = None
    for username, user_data in users.items():
        if user_data.get('token') == token:
            valid_user = username
            break
    
    if not valid_user:
        return jsonify({"error": "无效的 Token"}), 403

    if key != encode_to_base64(bin_param):
        return ""
    
    url = "https://xxz-xyzw.hortorgames.com/login/authuser?_seq=1"
    try:
        # 使用 safe_path 获取用户目录下的文件
        file_path = safe_path_with_username(valid_user, bin_param)
        with open(file_path, 'rb') as f:
           payload = f.read()
    except FileNotFoundError:
        return jsonify({"error": "文件未找到"}), 404
    except PermissionError:
        return jsonify({"error": "权限不足"}), 403

    headers = {
   'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 7.1.2; SM-G9810 Build/QP1A.190711.020)',
   'Host': 'xxz-xyzw.hortorgames.com',
   'Content-Type': 'application/octet-stream'
    }

    response = requests.request("POST", url, headers=headers, data=payload)
    result = extract_target_chars(response.text)
    roletoken = extract_token_content(result)
    json_data = {"roleToken": roletoken}
    json_result = json.dumps(json_data, indent=2)
    base64str = encode_to_base64(json_result)
    json_data1 = {"token": base64str}
    json_result1 = json.dumps(json_data1, indent=2)
    return json_result1

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
