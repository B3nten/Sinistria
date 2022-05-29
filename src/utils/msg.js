const colors = {
    error: 31,
    warn: 93,
    success: 32,
    blue: 36,
    dimmed: 90,
  };


function msg(message, color = 'blue'){
    return '\u001b[' + colors[color] + 'm' + message + '\u001b[0m'
}

module.exports = msg