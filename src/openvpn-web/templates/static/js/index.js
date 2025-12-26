window.vtable = null;
window.gid = null;

await import('/static/js/utils.js');
await import('/static/js/settings.js');
const user = await import('/static/js/user.js');
await import('/static/js/client.js');

let qt;
let now;
let lastMonth;

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));

const tables = {
  status: {
    columns: [
      { title: '用户名/客户端', data: 'username' },
      { title: 'VPN IP', data: 'vip' },
      { title: '用户 IP', data: 'rip' },
      { title: '下载流量', data: 'recvBytes' },
      { title: '上传流量', data: 'sendBytes' },
      { title: '上线时间', data: 'connDate' },
      { title: '时长', data: 'onlineTime' },
      {
        title: '操作',
        data: (data) => `<button type="button" class="btn btn-outline-danger btn-sm" id="killClient">断开</button>`,
      },
    ],
    dom:
      "<'d-flex justify-content-between'f<'toolbar'>>" +
      "<'row'<'col-sm-12'tr>>" +
      "<'d-flex justify-content-between align-items-center'lip>",
    fnInitComplete: function () {
      const interval = setInterval(() => {
        if ($('#serverTable').is(':hidden')) {
          clearInterval(interval);
        } else {
          vtable.ajax.reload(null, false);
        }
      }, 30000);
    },
    ajax: function (data, callback, settings) {
      request.get('/ovpn/online-client').then((data) => callback({ data }));
    },
  },
  user: {
    autoWidth: false,
    responsive: true,
    columns: [
      {
        title: 'ID',
        data: 'id',
        visible: false,
        searchable: false,
      },
      {
        title: '用户名',
        data: (data) =>
          `<button class="btn btn-link text-decoration-none p-0" id="showUserOffcanvas">${data.username}</button>`,
      },
      {
        title: '密码',
        data: (data) => {
          if (data.password.length == 0) {
            return data.password;
          }

          const html = `
          <div class="form-group d-flex justify-content-center align-items-center gap-1">
            <input class="border border-0 p-0 bg-transparent" style="outline: none;width: ${
              data.password.length * 7
            }px;max-width: 175px;" value="${data.password}" type="password" readonly>
            <button class="btn btn-link p-0" id="copyPass">
              <svg viewBox="64 64 896 896" focusable="false" data-icon="copy" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                <path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path>
              </svg>
            </button>
          </div>
          `;
          return html;
        },
      },
      { title: 'IP地址', data: 'ipAddr' },
      { title: '配置文件', data: 'ovpnConfig' },
      {
        title: 'MFA',
        data: (data) => (data.mfaSecret ? '开启' : ''),
      },
      {
        title: '状态',
        data: (data) => {
          const ed = new Date(data.expireDate);
          const now = new Date();
          ed.setHours(0, 0, 0, 0);
          now.setHours(0, 0, 0, 0);
          if (ed < now) {
            return `<span class="badge text-bg-danger">已过期</span>`;
          }

          return data.isEnable
            ? `<span class="badge text-bg-success">启用</span>`
            : `<span class="badge text-bg-secondary">禁用</span>`;
        },
      },
      { title: '姓名', data: 'name' },
      {
        title: '操作',
        data: (data) => {
          const html = `
          <button class="btn btn-link text-decoration-none p-0" id="editUser">编辑</button>
          ${
            data.isEnable === true
              ? '<button class="btn btn-link text-decoration-none p-0" id="disableUser">禁用</button>'
              : '<button class="btn btn-link text-decoration-none p-0" id="enableUser">启用</button>'
          }
          <button class="btn btn-link text-decoration-none p-0 btn-delete" data-bs-toggle="popover" data-delete-type="user" data-delete-name="${
            data.username
          }">删除</button>
          <div class="btn btn-link text-decoration-none p-0 dropdown">
            <button class="btn btn-link text-decoration-none p-0 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              更多
            </button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" id="resetPass">重置密码</a></li>
              <li><a class="dropdown-item" id="resetMfa">重置MFA</a></li>
            </ul>
          </div>
          `;
          return html;
        },
      },
    ],
    order: [[0, 'desc']],
    buttons: {
      dom: {
        button: { className: 'btn btn-sm' },
      },
      buttons: [
        {
          text: '导入',
          className: 'btn-primary border-end',
          action: () => {
            $('#importUserModal').modal('show');
          },
        },
        {
          text: '添加',
          className: 'btn-primary border-start',
          action: () => {
            const elem = document.querySelector('#addUserModal input[name="expireDate"]');
            const datepicker = new Datepicker(elem, {
              buttonClass: 'btn',
              format: 'yyyy-mm-dd',
              autohide: true,
              language: 'zh-CN',
              orientation: 'top',
              minDate: new Date(),
            });

            request.get('/ovpn/client').then((data) => {
              $('#addUserModal select[name="ovpnConfig"]').html(
                data.map((i) => `<option value="${i.fullName}">${i.name}</option>`)
              );

              $('#addUserModal').modal('show');
            });
          },
        },
      ],
    },
    dom:
      "<'row align-items-center'<'col d-flex'f><'col d-flex justify-content-center toolbar'><'col d-flex justify-content-end'B>>" +
      "<'row'<'col-sm-12'tr>>" +
      "<'d-flex justify-content-between align-items-center'lip>",
    fnInitComplete: function (oSettings, data) {
      $('#vtable_wrapper div.toolbar').html(
        `<div class="form-check form-switch form-check-reverse">
          <input class="form-check-input" type="checkbox" role="switch" id="authUser" style="cursor: pointer;" ${
            data.authUser ? 'checked' : ''
          }>
          <label class="form-check-label">账号启用: </label>
        </div>
        `
      );
    },
    drawCallback: function (settings) {
      $('#vtable .btn-delete').popover('dispose');
      $('#vtable .btn-delete').popover({
        container: 'body',
        placement: 'top',
        html: true,
        sanitize: false,
        trigger: 'click',
        title: '提示',
        content: function () {
          const name = $(this).data('delete-name');
          return `
            <div>
              <p>确定删除 <strong>${name}</strong> 吗？</p>
              <div class="d-flex justify-content-center">
                <button class="btn btn-secondary btn-sm me-2 btn-popover-cancel">取消</button>
                <button class="btn btn-primary btn-sm btn-popover-confirm">确认</button>
              </div>
            </div>
          `;
        },
      });
    },
    ajax: function (data, callback, settings) {
      request.get('/ovpn/user').then((data) => callback({ data: data?.users, authUser: data?.authUser }));
    },
  },
  history: {
    columns: [
      { title: '用户名', data: 'username' },
      { title: '客户端', data: 'common_name' },
      { title: 'VPN IP', data: 'vip' },
      { title: '用户 IP', data: 'rip' },
      { title: '下载流量', data: 'bytes_received' },
      { title: '上传流量', data: 'bytes_sent' },
      { title: '上线时间', data: 'time_unix' },
      { title: '在线时长', data: 'time_duration' },
    ],
    order: [[6, 'desc']],
    processing: true,
    serverSide: true,
    search: {
      return: true,
    },
    dom:
      "<'row align-items-center'<'col d-flex'f><'col d-flex justify-content-center toolbar'><'col d-flex justify-content-end'B>>" +
      "<'row'<'col-sm-12'tr>>" +
      "<'d-flex justify-content-between align-items-center'lip>",
    fnInitComplete: function (oSettings, data) {
      $('#vtable_wrapper div.toolbar').html(
        `<div id="datepicker">
          <div class="input-group input-group-sm">
            <input type="text" class="form-control text-center" name="start" />
            <span class="input-group-text">to</span>
            <input type="text" class="form-control text-center" name="end" />
          </div>
        </div>
        `
      );

      const elem = document.getElementById('datepicker');
      const rangepicker = new DateRangePicker(elem, {
        buttonClass: 'btn',
        container: elem,
        format: 'yyyy-mm-dd',
        autohide: true,
        language: 'zh-CN',
      });

      rangepicker.setDates(lastMonth, now);

      elem.addEventListener('changeDate', (e) => {
        qt = rangepicker.getDates().map((d, i) => {
          if (d instanceof Date) {
            if (i == 1) {
              d.setHours(23, 59, 59, 0);
            }

            return Date.parse(d) / 1000;
          }

          return qt[i];
        });

        vtable.ajax.reload();
      });
    },
    buttons: {
      dom: {
        button: { className: 'btn btn-sm' },
      },
      buttons: [
        {
          text: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"> <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/> <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/> </svg> 刷新 ',
          className: 'btn-primary',
          action: () => vtable.ajax.reload(),
        },
      ],
    },
    ajax: function (data, callback, settings) {
      const orderColumn = data.columns[data.order[0].column].data;
      const order = data.order[0].dir;
      const params = {
        draw: data.draw,
        offset: data.start,
        limit: data.length,
        orderColumn: orderColumn,
        order: order,
        search: data.search.value,
        qt: qt.join(),
      };

      request.get(`/ovpn/history?${new URLSearchParams(params).toString()}`).then((data) => callback(data));
    },
  },
  client: {
    columns: [
      { title: '名称', data: 'name' },
      { title: '日期', data: 'date' },
      {
        title: '操作',
        data: (data) => {
          const html = `
          <div class="d-grid gap-2 d-flex justify-content-center align-items-center">
            <a href="${data.file}" download="${data.fullName}" class="text-decoration-none">下载</a>
            <div class="dropdown">
              <button class="btn btn-link text-decoration-none p-0 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                编辑
              </button>
              <ul class="dropdown-menu">
                <li><button type="button" class="dropdown-item" id="editCCD">CCD配置</button></li>
                <li><button type="button" class="dropdown-item" id="editClient">客户端配置</button></li>
              </ul>
            </div>
            <button class="btn btn-link text-decoration-none p-0 btn-delete" data-bs-toggle="popover" data-delete-type="client" data-delete-name="${data.name}">删除</button>
          </div>
          `;
          return html;
        },
      },
    ],
    order: [[1, 'desc']],
    buttons: {
      dom: {
        button: { className: 'btn btn-sm' },
      },
      buttons: [
        {
          text: '添加',
          className: 'btn-primary',
          action: () => $('#addClientModal').modal('show'),
        },
      ],
    },
    dom:
      "<'d-flex justify-content-between align-items-center'fB>" +
      "<'row'<'col-sm-12'tr>>" +
      "<'d-flex justify-content-between align-items-center'lip>",
    drawCallback: function (settings) {
      $('#vtable .btn-delete').popover('dispose');
      $('#vtable .btn-delete').popover({
        container: 'body',
        placement: 'top',
        html: true,
        sanitize: false,
        trigger: 'click',
        title: '提示',
        content: function () {
          const name = $(this).data('delete-name');
          return `
            <div>
              <p>确定删除 <strong>${name}</strong> 吗？</p>
              <div class="d-flex justify-content-center">
                <button class="btn btn-secondary btn-sm me-2 btn-popover-cancel">取消</button>
                <button class="btn btn-primary btn-sm btn-popover-confirm">确认</button>
              </div>
            </div>
          `;
        },
      });
    },
    ajax: function (data, callback, settings) {
      request.get('/ovpn/client').then((data) => callback({ data }));
    },
  },
  cert: {
    columns: [
      { title: '名称', data: 'name' },
      { title: '类型', data: 'type' },
      {
        title: '状态',
        data: (data) => {
          let badgeClass = 'text-bg-success';
          if (data.status === '已过期') {
            badgeClass = 'text-bg-danger';
          } else if (data.status === '即将过期') {
            badgeClass = 'text-bg-warning';
          }
          return `<span class="badge ${badgeClass}">${data.status}</span>`;
        },
      },
      { title: '颁发时间', data: 'notBefore' },
      { title: '过期时间', data: 'notAfter' },
      { title: '剩余天数', data: 'expiresIn' },
    ],
    order: [[3, 'desc']],
    buttons: {
      dom: {
        button: { className: 'btn btn-sm' },
      },
      buttons: [
        {
          text: '更新证书',
          className: 'btn-primary',
          action: () => $('#renewCertModal').modal('show'),
        },
      ],
    },
    dom:
      "<'d-flex justify-content-between align-items-center'fB>" +
      "<'row'<'col-sm-12'tr>>" +
      "<'d-flex justify-content-between align-items-center'lip>",
    ajax: function (data, callback, settings) {
      request.get('/ovpn/certs').then((data) => callback({ data }));
    },
  },
};

const initTable = (tab) => {
  if (tab === 'status') {
    $('#vtableContainer').removeClass('my-3').addClass('my-5');
    $('#serverTable').show();
  } else {
    $('#vtableContainer').removeClass('my-5').addClass('my-3');
    $('#serverTable').hide();
  }

  if (tab === 'history') {
    now = new Date();
    lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    lastMonth.setHours(0, 0, 0, 0);
    now.setHours(23, 59, 59, 0);
    qt = [Date.parse(lastMonth) / 1000, Date.parse(now) / 1000];
  }

  if (vtable) {
    $('#vtable .btn-delete').popover('dispose');
    vtable.destroy();
    $('#vtable').empty();
  }

  window.vtable = $('#vtable').DataTable({
    language: {
      url: '/static/zh.json',
      loadingRecords: '数据加载中...',
    },
    columnDefs: [{ className: 'dt-center', targets: '_all' }],
    drawCallback: function () {
      $('ul.pagination').addClass('pagination-sm');
    },
    ...tables[tab],
  });
};

const urlParams = new URLSearchParams(window.location.search);
const tabs = Object.keys(tables);

if (tabs.includes(urlParams.get('tab'))) {
  initTable(urlParams.get('tab'));
} else {
  initTable('status');
}

$('#vtable').on('shown.bs.popover', '.btn-delete', function () {
  const popoverInstance = bootstrap.Popover.getInstance(this);
  const popoverEl = $(popoverInstance.tip);
  const row = vtable.row($(this).parents('tr')).data();
  const delType = $(this).data('delete-type');

  if (!popoverInstance) return;

  popoverEl
    .find('.btn-popover-confirm')
    .off('click')
    .on('click', function () {
      switch (delType) {
        case 'user':
          request.delete(`/ovpn/user/${row.id}`).then((data) => {
            popoverInstance.hide();
            message.success(data.message);
            vtable.ajax.reload(null, false);
          });
          break;
        case 'client':
          request.delete(`/ovpn/client/${row.name}`).then((data) => {
            popoverInstance.hide();
            message.success(data.message);
            vtable.ajax.reload(null, false);
          });
          break;
      }
    });

  popoverEl
    .find('.btn-popover-cancel')
    .off('click')
    .on('click', function () {
      popoverInstance.hide();
    });
});

$('#vtable').on('show.bs.popover', '.btn-delete', function () {
  $('.btn-delete')
    .not(this)
    .each(function () {
      var popoverInstance = bootstrap.Popover.getInstance(this);
      if (popoverInstance) {
        popoverInstance.hide();
      }
    });
});

$(document).on('click', function (e) {
  if (
    $(e.target).data('toggle') !== 'popover' &&
    $(e.target).parents('.popover.show').length === 0 &&
    $(e.target).parents('.btn-delete').length === 0 &&
    !$(e.target).hasClass('btn-delete')
  ) {
    $('.btn-delete').popover('hide');
  }
});

$('#showUser').click(function () {
  window.history.pushState(null, '', '?tab=user');
  initTable('user');
  if ('{{.ldapAuth}}' == 'true') {
    const toast = $('#alertToast');
    toast.find('.toast-body').text('已启用LDAP认证，本地VPN账号将不在工作！');
    bootstrap.Toast.getOrCreateInstance(toast).show();
  }
});

$('#showHistory').click(function () {
  window.history.pushState(null, '', '?tab=history');
  initTable('history');
});

$('#showClient').click(function () {
  window.history.pushState(null, '', '?tab=client');
  initTable('client');
});

$('#manageCert').click(function () {
  window.history.pushState(null, '', '?tab=cert');
  initTable('cert');
});

$('#restartSrv').click(function () {
  $('#restartSrvModal').modal('show');
});

$('#restartSrvSumbit').click(function () {
  request.post('/ovpn/server', { action: 'restartSrv' }).then((data) => {
    $('#restartInfoModal').modal('hide');
    message.success(data.message);
  });
});

$('#sconfig').click(function () {
  request.post('/ovpn/server', { action: 'getConfig' }).then((data) => {
    $('#editServerModal textarea[name="config"]').val(data.content);
    $('#editServerModal').modal('show');
  });
});

$('#editServerSumbit').click(function () {
  const content = $('#editServerModal textarea[name="config"]').val();

  $('#editServerModal').modal('hide');
  request.post('/ovpn/server', { action: 'updateConfig', content }).then((data) => {
    message.success(data.message);
  });
});

$(document).on('click', '#killClient', function () {
  const id = vtable.row($(this).parents('tr')).data().id;

  request.post('/ovpn/kill', { cid: id }).then(() => {
    vtable.cell(this).row().remove().draw();
  });
});
