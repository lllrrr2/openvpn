// 更新证书
$('#renewCertModal form').submit(function () {
  const day = $('#renewCertModal input[name="day"]').val();

  $('#renewCertModal').modal('hide');

  request.post('/ovpn/server', { action: 'renewCert', day }).then((data) => {
    message.success(data.message);
    vtable.ajax.reload(null, false);
  });
  return false;
});
