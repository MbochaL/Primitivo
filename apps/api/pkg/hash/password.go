// Package hash encapsula el hashing de contraseñas con bcrypt.
package hash

import "golang.org/x/crypto/bcrypt"

// Hash genera el hash bcrypt de una contraseña en texto plano.
func Hash(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// Compare verifica que una contraseña en texto plano coincida con su hash.
// Devuelve error si no coinciden.
func Compare(hashed, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(password))
}
