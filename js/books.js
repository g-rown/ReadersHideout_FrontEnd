// Token check
const token = localStorage.getItem("accessToken");
if (!token) window.location.href = "/";

const API_URL = "https://readershideout-backend.onrender.com/api/books/";
const CATEGORY_URL = "https://readershideout-backend.onrender.com/api/categories/";

const authHeaders = () => ({ "Authorization": `Bearer ${token}` });

// LOAD BOOKS
async function loadBooks() {
    const table = document.getElementById("booksTable");
    if (!table) return;

    const query = document.getElementById("searchInput").value || "";
    const url = API_URL + (query ? `?search=${encodeURIComponent(query)}` : "");

    try {
        const res = await fetch(url, { headers: authHeaders() });
        if (!res.ok) throw new Error("Failed to fetch books");
        const data = await res.json();

        table.innerHTML = "";
        data.forEach(book => {
            const categoryName = book.category ? book.category.name : "N/A";
            const loc = book.shelf
                ? `Shelf ${book.shelf} - Row ${book.row} - Col ${book.column}`
                : "N/A";

            table.innerHTML += `
                <tr>
                    <td><img src="${book.cover}" style="width:60px"></td>
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td>${book.isbn}</td>
                    <td>${loc}</td>
                    <td>${categoryName}</td>
                    <td>${book.available_copies} / ${book.total_copies}</td>
                    <td>
                        <a href="add-book.html?id=${book.id}" class="btn btn-primary btn-sm" aria-label="Edit book" title="Edit book"><i class="bi bi-pencil-square"></i></a>
                        <button class="btn btn-danger btn-sm" onclick="deleteBook(${book.id})" aria-label="Delete book" title="Delete book"><i class="bi bi-x-lg"></i></button>
                    </td>
                </tr>`;
        });
    } catch (err) {
        console.error(err);
        alert("Error loading books");
    }
}

// DELETE BOOK
async function deleteBook(id) {
    if (!confirm("Delete this book?")) return;
    try {
        const res = await fetch(`${API_URL}${id}/`, { method: "DELETE", headers: authHeaders() });
        if (!res.ok) throw new Error("Delete failed");
        loadBooks();
    } catch (err) {
        console.error(err);
        alert("Error deleting book");
    }
}

// SAVE BOOK 
async function saveBook(event) {
    event.preventDefault();
    const form = document.getElementById("bookForm");
    if (!form) return;

    const id = document.getElementById("bookId")?.value;
    const formData = new FormData();

    const fields = ["title", "author", "isbn", "total_copies", "category_id", "shelf", "row", "column"];
    fields.forEach(field => {
        const el = document.getElementById(field);
        if (el) formData.append(field, el.value);
    });

    const cover = document.getElementById("cover");
    if (cover && cover.files.length > 0) formData.append("cover", cover.files[0]);

    let url = API_URL;
    let method = "POST";
    if (id) {
        url = API_URL + id + "/";
        method = "PUT";
    }

    try {
        const res = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}` }, body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || JSON.stringify(data));
        alert("Saved successfully!");
        window.location.href = "books.html";
    } catch (err) {
        console.error(err);
        alert("Error saving book: " + err.message);
    }
}

// LOAD CATEGORIES
async function loadCategories() {
    const select = document.getElementById("category_id");
    if (!select) return;

    try {
        const res = await fetch(CATEGORY_URL, { headers: authHeaders() });
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();

        select.innerHTML = '<option value="">-- None --</option>';
        data.forEach(cat => select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`);
    } catch (err) {
        console.error(err);
        alert("Error loading categories");
    }
}

// POPULATE FORM
async function populateForm() {
    const form = document.getElementById("bookForm");
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    await loadCategories();
    if (!id) return;

    try {
        const res = await fetch(`${API_URL}${id}/`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Failed to fetch book");
        const book = await res.json();

        document.getElementById("formTitle").textContent = "Edit Book";
        document.getElementById("bookId").value = book.id;
        document.getElementById("title").value = book.title;
        document.getElementById("author").value = book.author;
        document.getElementById("isbn").value = book.isbn;
        document.getElementById("total_copies").value = book.total_copies;
        document.getElementById("shelf").value = book.shelf ?? "";
        document.getElementById("column").value = book.column ?? "";
        document.getElementById("row").value = book.row ?? "";
        if (book.category) document.getElementById("category_id").value = book.category.id;
    } catch (err) {
        console.error(err);
        alert("Error populating form");
    }
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("booksTable")) {
        loadBooks();
        document.getElementById("searchInput").addEventListener("input", loadBooks);
    }

    if (document.getElementById("bookForm")) {
        populateForm();
        document.getElementById("bookForm").addEventListener("submit", saveBook);
    }
});
