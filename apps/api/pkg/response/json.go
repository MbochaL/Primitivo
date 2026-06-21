// Package response centraliza el formato de las respuestas JSON de la API.
package response

import "github.com/gin-gonic/gin"

// ErrorBody es el cuerpo de un error con código estable y mensaje legible.
type ErrorBody struct {
	Codigo  string `json:"codigo"`
	Mensaje string `json:"mensaje"`
}

// ErrorResponse es la forma única de los errores de la API.
type ErrorResponse struct {
	Error ErrorBody `json:"error"`
}

// Error responde un error con la forma única `{ "error": { "codigo", "mensaje" } }`.
func Error(c *gin.Context, status int, codigo, mensaje string) {
	c.JSON(status, ErrorResponse{Error: ErrorBody{Codigo: codigo, Mensaje: mensaje}})
}

// JSON responde un payload de éxito con el status indicado.
func JSON(c *gin.Context, status int, data any) {
	c.JSON(status, data)
}
