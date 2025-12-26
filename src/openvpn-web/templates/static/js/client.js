// 添加客户端
$('#addClientModal form').submit(function () {
  const name = $('#addClientModal input[name="name"]').val();
  const serverAddr = $('#addClientModal input[name="serverAddr"]').val() || location.hostname;
  const serverPort = $('#addClientModal input[name="serverPort"]').val();
  const config = $('#addClientModal textarea[name="config"]').val();
  const ccdConfig = $('#addClientModal textarea[name="ccdConfig"]').val();
  const mfa = $('#addClientModal input[name="mfa"]').is(':checked');

  request.post('/ovpn/client', { name, serverAddr, serverPort, config, ccdConfig, mfa }).then((data) => {
    vtable.ajax.reload(null, false);
    $('#addClientModal').modal('hide');
    $('#addClientModal form').trigger('reset');
    message.success(data.message);
  });

  return false;
});

// 编辑客户端
$(document).on('click', '#editClient', function () {
  const name = vtable.row($(this).parents('tr')).data().name;
  $('#editClientModal input[name="name"]').val(`clients/${name}.ovpn`);

  request.get(`/ovpn/client?a=getConfig&file=clients/${encodeURIComponent(name)}.ovpn`).then((data) => {
    $('#editClientModal textarea[name="config"]').val(data.content);
    $('#editClientModal').modal('show');
  });
});

$('#editClientSumbit').click(function () {
  const name = $('#editClientModal input[name="name"]').val();
  const content = $('#editClientModal textarea[name="config"]').val();

  $('#editClientModal').modal('hide');
  request.put(`/ovpn/client?file=${encodeURIComponent(name)}`, { content }).then((data) => {
    message.success(data.message);
  });
});

// 编辑CCD
$(document).on('click', '#editCCD', function () {
  const name = vtable.row($(this).parents('tr')).data().name;
  $('#editClientModal input[name="name"]').val(`ccd/${name}`);

  request.get(`/ovpn/client?a=getConfig&file=ccd/${encodeURIComponent(name)}`).then((data) => {
    $('#editClientModal textarea[name="config"]').val(data.content);
    $('#editClientModal').modal('show');
  });
});
