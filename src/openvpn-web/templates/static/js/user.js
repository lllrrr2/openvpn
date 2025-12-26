// 显示用户详情
$(document).on('click', '#showUserOffcanvas', function () {
  const data = vtable.row($(this).parents('tr')).data();
  const oc = new bootstrap.Offcanvas($('#userOffcanvas'));

  const ed = new Date(data.expireDate);
  const now = new Date();
  ed.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const html = `
    <div class="desc-item row">
      <div class="col-5 desc-label">ID</div>
      <div class="col-7 desc-value">${data.id}</div>
    </div>
    <div class="desc-item row">
      <div class="col-5 desc-label">用户名</div>
      <div class="col-7 desc-value">${data.username}</div>
    </div>
    <div class="desc-item row">
      <div class="col-5 desc-label">密码</div>
      <div class="col-7 desc-value">${data.password}</div>
    </div>
    <div class="desc-item row">
      <div class="col-5 desc-label">IP地址</div>
      <div class="col-7 desc-value">${data.ipAddr}</div>
    </div>
    <div class="desc-item row">
      <div class="col-5 desc-label">配置文件</div>
      <div class="col-7 desc-value">${data.ovpnConfig}</div>
    </div>
    <div class="desc-item row">
      <div class="col-5 desc-label">MFA</div>
      <div class="col-7 desc-value">${data.mfaSecret}</div>
    </div>
    <div class="desc-item row">
      <div class="col-5 desc-label">状态</div>
      <div class="col-7 desc-value">${ed < now ? '已过期' : data.isEnable ? '启用' : '禁用'}</div>
    </div>
    <div class="desc-item row">
      <div class="col-5 desc-label">姓名</div>
      <div class="col-7 desc-value">${data.name}</div>
    </div>
    <div class="desc-item row">
      <div class="col-5 desc-label">过期时间</div>
      <div class="col-7 desc-value">
        ${data.expireDate ? dayjs(data.expireDate).format('YYYY-MM-DD HH:mm:ss') : ''}
      </div>
    </div>
    <div class="desc-item row">
      <div class="col-5 desc-label">创建时间</div>
      <div class="col-7 desc-value">${dayjs(data.createdAt).format('YYYY-MM-DD HH:mm:ss')}</div>
    </div>
    <div class="desc-item row">
      <div class="col-5 desc-label">更新时间</div>
      <div class="col-7 desc-value">${dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</div>
    </div>
    `;

  $('#userOffcanvas .offcanvas-body').html(html);
  oc.show();
});

// 导入用户
let files = [];
const uploadFile = new FormData();
const importUserFileDropZone = document.querySelector('#importUserModal .file-drop-zone');
const importUserFileInput = document.querySelector('#importUserModal input[name="fileInput"]');
const importUserFileList = document.querySelector('#importUserModal .file-list');
const renderFileList = () => {
  importUserFileList.innerHTML = '';
  files.forEach((f, index) => {
    const div = document.createElement('div');
    const flieSpan = document.createElement('span');
    const delBtn = document.createElement('button');

    div.className = 'd-flex align-items-center';
    flieSpan.textContent = `📄 ${f.name}`;
    delBtn.type = 'button';
    delBtn.className = 'ms-4 btn-close';
    delBtn.setAttribute('style', 'font-size: 0.8rem;');
    delBtn.setAttribute('aria-label', 'Close');
    delBtn.addEventListener('click', () => {
      files.splice(index, 1);
      renderFileList();
      $('#importUserSubmit').attr('disabled', true);
    });

    div.appendChild(flieSpan);
    div.appendChild(delBtn);
    importUserFileList.appendChild(div);
  });
};

importUserFileDropZone.addEventListener('click', () => importUserFileInput.click());
importUserFileDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  $(this).addClass('bg-light');
});
importUserFileDropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  $(this).removeClass('bg-light');
});
importUserFileDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  $(this).removeClass('bg-light');

  files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.csv'));
  if (files.length > 1) {
    message.error('不支持多个文件导入');
    return;
  }
  if (files.length === 0) {
    message.error('只允许上传csv文件');
    return;
  }

  $('#importUserSubmit').attr('disabled', false);
  uploadFile.set('file', files[0]);
  renderFileList();
});
importUserFileInput.addEventListener('change', (e) => {
  files = Array.from(e.target.files).filter((f) => f.name.endsWith('.csv'));
  if (files.length === 0) {
    message.error('只允许上传csv文件');
    return;
  }

  $('#importUserSubmit').attr('disabled', false);
  uploadFile.set('file', files[0]);
  renderFileList();
});

$('#importUserSubmit').click(function () {
  fetch('/ovpn/user', {
    method: 'POST',
    body: uploadFile,
  })
    .then(async (response) => {
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message || response.text || response.statusText);
      }

      return body;
    })
    .then((data) => {
      $('#importUserModal').modal('hide');
      message.success(data.message);
      vtable.ajax.reload(null, false);
      uploadFile.delete('file');
    })
    .catch((error) => {
      switch (true) {
        case error.message.includes('UNIQUE constraint failed: user.ip_addr'):
          message.error('导入文件有IP已经使用');
          break;
        case error.message.includes('UNIQUE constraint failed: user.username'):
          message.error('导入文件有用户名已存在');
          break;
        default:
          message.error(error.message);
      }
    });
});

// 添加用户
$('#addUserModal form').submit(function () {
  const name = $('#addUserModal input[name="name"]').val();
  const username = $('#addUserModal input[name="username"]').val();
  const password = $('#addUserModal input[name="password"]').val();
  const ipAddr = $('#addUserModal input[name="ipAddr"]').val();
  const expireDate = $('#addUserModal input[name="expireDate"]').val();
  const ovpnConfig = $('#addUserModal select[name="ovpnConfig"]').val() || '';

  request
    .post('/ovpn/user', {
      name,
      username,
      password,
      ipAddr,
      expireDate,
      ovpnConfig,
    })
    .then((data) => {
      vtable.ajax.reload(null, false);
      // vtable.columns.adjust().draw(false);
      $('#addUserModal form').trigger('reset');
      $('#addUserModal').modal('hide');
    });

  return false;
});

$(document).on('keyup', '#addUserModal input[name="ipAddr"]', function () {
  const ipAddr = $('#addUserModal input[name="ipAddr"]').val();
  const regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  if (regex.test(ipAddr) || ipAddr.length == 0) {
    $('#addUserModal .form-text').addClass('d-none');
    $('#addUserModal input[name="ipAddr"]').removeClass('border border-danger');
    $('#addUserModal :submit').removeAttr('disabled');
  } else {
    $('#addUserModal .form-text').text('非法IP地址！');
    $('#addUserModal .form-text').addClass('text-danger');
    $('#addUserModal input[name="ipAddr"]').addClass('border border-danger');
    $('#addUserModal .form-text').removeClass('d-none');
    $('#addUserModal :submit').attr('disabled', true);
  }
});

// 编辑用户
$(document).on('click', '#editUser', function () {
  const id = vtable.row($(this).parents('tr')).data().id;
  const name = vtable.row($(this).parents('tr')).data().name;
  const username = vtable.row($(this).parents('tr')).data().username;
  const ipAddr = vtable.row($(this).parents('tr')).data().ipAddr;
  const expireDate = vtable.row($(this).parents('tr')).data().expireDate;
  const ovpnConfig = vtable.row($(this).parents('tr')).data().ovpnConfig;

  $('#editUserModal input[name="id"]').val(id);
  $('#editUserModal input[name="name"]').val(name);
  $('#editUserModal input[name="username"]').val(username);
  $('#editUserModal input[name="ipAddr"]').val(ipAddr);
  $('#editUserModal input[name="expireDate"]').val(expireDate);

  request.get('/ovpn/client').then((data) => {
    $('#editUserModal select[name="ovpnConfig"]').html(
      data.map((i) => {
        if (i.fullName === ovpnConfig) {
          return `<option value="${i.fullName}" selected>${i.name}</option>`;
        }

        return `<option value="${i.fullName}">${i.name}</option>`;
      })
    );
  });

  $('#editUserModal select[name="ovpnConfig"]').val(ovpnConfig);

  const elem = document.querySelector('#editUserModal input[name="expireDate"]');
  const datepicker = new Datepicker(elem, {
    buttonClass: 'btn',
    format: 'yyyy-mm-dd',
    autohide: true,
    language: 'zh-CN',
    orientation: 'top',
    minDate: new Date(),
  });

  datepicker.setDate(new Date(expireDate));

  $('#editUserModal').modal('show');
});

$('#editUserModal form').submit(function () {
  const id = $('#editUserModal input[name="id"]').val();
  const name = $('#editUserModal input[name="name"]').val();
  const username = $('#editUserModal input[name="username"]').val();
  const ipAddr = $('#editUserModal input[name="ipAddr"]').val();
  const expireDate = $('#editUserModal input[name="expireDate"]').val();
  const ovpnConfig = $('#editUserModal select[name="ovpnConfig"]').val() || '';

  request.patch('/ovpn/user', { id, name, username, ipAddr, expireDate, ovpnConfig }).then((data) => {
    vtable.ajax.reload(null, false);
    $('#editUserModal').modal('hide');
    message.success(data.message);
  });

  return false;
});

$(document).on('keyup', '#editUserModal input[name="ipAddr"]', function () {
  const ipAddr = $('#editUserModal input[name="ipAddr"]').val();
  const regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  if (regex.test(ipAddr) || ipAddr.length == 0) {
    $('#editUserModal .form-text').addClass('d-none');
    $('#editUserModal input[name="ipAddr"]').removeClass('border border-danger');
    $('#editUserModal :submit').removeAttr('disabled');
  } else {
    $('#editUserModal .form-text').text('非法IP地址！');
    $('#editUserModal .form-text').addClass('text-danger');
    $('#editUserModal input[name="ipAddr"]').addClass('border border-danger');
    $('#editUserModal .form-text').removeClass('d-none');
    $('#editUserModal :submit').attr('disabled', true);
  }
});

// 启用/禁用用户认证
$(document).on('change', '#authUser', function () {
  request
    .post('/ovpn/server', {
      action: 'settings',
      key: 'auth-user',
      value: $(this).is(':checked'),
    })
    .then((data) => {
      message.success(data.message);
    })
    .catch(() => {
      $('#authUser').prop('checked', false);
    });
});

// 复制密码
$(document).on('click', '#copyPass', function () {
  copyToClipboard(this.previousSibling.previousSibling.value?.trim());

  const icon = $(this).html();
  $(this).html(`
    <svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
    </svg>`);
  $(this).addClass('text-success');
  $(this).attr('disabled', true);

  setTimeout(() => {
    $(this).html(icon);
    $(this).removeClass('text-success');
    $(this).attr('disabled', false);
  }, 1500);
});

// 禁用用户
$(document).on('click', '#disableUser', function () {
  const id = vtable.row($(this).parents('tr')).data().id;

  request.patch('/ovpn/user', { id, isEnable: false }).then((data) => {
    message.success(data.message);
    vtable.ajax.reload(null, false);
  });
});

// 启用用户
$(document).on('click', '#enableUser', function () {
  const id = vtable.row($(this).parents('tr')).data().id;

  request.patch('/ovpn/user', { id, isEnable: true }).then((data) => {
    message.success(data.message);
    vtable.ajax.reload(null, false);
  });
});

// 重置MFA
$(document).on('click', '#resetMfa', function () {
  const id = vtable.row($(this).parents('tr')).data().id;
  $('#resetMfaInfoModal input[name="id"]').val(id);
  $('#resetMfaInfoModal').modal('show');
});

$('#resetMfaInfoSumbit').click(function () {
  const id = $('#resetMfaInfoModal input[name="id"]').val();
  request.delete(`/client/mfa/${id}`).then((data) => {
    $('#resetMfaInfoModal').modal('hide');
    message.success('MFA已重置');
    vtable.ajax.reload(null, false);
  });
});

// 重置密码
$(document).on('click', '#resetPass', function () {
  const id = vtable.row($(this).parents('tr')).data().id;
  const username = vtable.row($(this).parents('tr')).data().username;
  $('#resetPassModal input[name="id"]').val(id);
  $('#resetPassModal input[name="username"]').val(username);

  $('#resetPassModal').modal('show');
});

$(document).on('keyup', '#resetPassModal input[name="newPassAgain"]', function () {
  const newPss = $('#resetPassModal input[name="newPass"]').val();
  const newPassAgain = $('#resetPassModal input[name="newPassAgain"]').val();

  if (newPassAgain == newPss) {
    $('#resetPassModal .form-text').addClass('d-none');
    $('#resetPassModal input[name="newPassAgain"]').removeClass('border border-danger');
    $('#resetPassSumbit').removeAttr('disabled');
  } else {
    $('#resetPassModal .form-text').text('密码不一致！');
    $('#resetPassModal .form-text').addClass('text-danger');
    $('#resetPassModal input[name="newPassAgain"]').addClass('border border-danger');
    $('#resetPassModal .form-text').removeClass('d-none');
    $('#resetPassSumbit').attr('disabled', true);
  }
});

$('#resetPassModal form').submit(function () {
  const id = $('#resetPassModal input[name="id"]').val();
  const newPass = $('#resetPassModal input[name="newPassAgain"]').val();

  request.patch('/ovpn/user', { id, password: newPass }).then(() => {
    vtable.ajax.reload(null, false);
    $('#resetPassModal form').trigger('reset');
    $('#resetPassModal').modal('hide');
    message.success('密码重置成功');
  });

  return false;
});
