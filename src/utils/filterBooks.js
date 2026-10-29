export function filterBooks(books, { search = '', categoria = '' } = {}) {
  const term = search.trim().toLowerCase()
  return books.filter((b) => {
    const haystack = [b.titulo, b.autor, b.editorial, b.isbn].join(' ').toLowerCase()
    const matchSearch = term ? haystack.includes(term) : true
    const matchCat = categoria ? b.categoria === categoria : true
    return matchSearch && matchCat
  })
}
