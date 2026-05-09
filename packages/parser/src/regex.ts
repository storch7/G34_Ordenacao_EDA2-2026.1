// Regex para Nginx/Apache Common Log Format
// Exemplo: 192.168.1.100 - - [10/May/2026:14:32:10 +0000] "GET /api/data HTTP/1.1" 200 1024
// Grupos capturados:
// 1. IP
// 2. Timestamp string ("10/May/2026:14:32:10 +0000")
// 3. Método HTTP
// 4. Endpoint
// 5. Status code
// 6. Size (bytes ou "-")
export const COMMON_LOG_REGEX = /^(\S+) \S+ \S+ \[([^\]]+)\] "([A-Z]+) ([^" ]+) HTTP\/[0-9.]+" (\d{3}) (\d+|-)/;
