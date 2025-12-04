const token = localStorage.getItem("accessToken");
if (!token) {
    window.location.href = "/";
}

const BORROW_URL = "http://127.0.0.1:8000/api/borrowings/"; 
const BOOKS_URL = "http://127.0.0.1:8000/api/books/";

const authHeaders = () => ({ "Authorization": `Bearer ${token}` });


// LOAD AVAILABLE BOOKS
async function loadAvailableBooks() {
    const res = await fetch(BOOKS_URL, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.status === 401) return window.location.href = "/";

    const data = await res.json();
    const bookSelect = document.getElementById("book_id");
    bookSelect.innerHTML = '<option value="">-- Select Book --</option>';

    data.forEach(book => {
        if (book.available_copies > 0) {
            const opt = document.createElement("option");
            opt.value = book.id;
            opt.textContent = `${book.title} by ${book.author} (Available: ${book.available_copies})`;
            bookSelect.appendChild(opt);
        }
    });
}


// BORROW BOOK
async function borrowBook(event) {
    event.preventDefault();

    const book_id_raw = document.getElementById("book_id").value;
    const borrower_name = document.getElementById("borrower_name").value.trim();
    const borrower_contact = document.getElementById("borrower_phone").value.trim(); 
    const borrower_email = document.getElementById("borrower_email").value.trim();
    const borrower_location = document.getElementById("borrower_location").value.trim();

    console.log("Book ID:", book_id_raw);
    console.log("Borrower Name:", borrower_name);
    console.log("Borrower Address VALUE:", borrower_location);

    if (!book_id_raw || !borrower_name || !borrower_contact) {
        alert("Please select a book, enter borrower name, and phone number.");
        return;
    }

    const book_id_int = parseInt(book_id_raw);

    const csrfToken = getCookie("csrftoken");

    const res = await fetch(BORROW_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-CSRFToken": csrfToken
        },
        body: JSON.stringify({
            book_id: book_id_int,
            borrower_name: borrower_name,
            borrower_contact: borrower_contact,
            borrower_email: borrower_email,
            borrower_address: borrower_location,
        })
    });

    if (!res.ok) {
        const err = await res.json();
        console.error("Borrow Error:", err);
        alert("Error borrowing book: " + (err.error || JSON.stringify(err)));
        return;
    }

    alert("Book borrowed successfully!");
    window.location.href = "/borrowed/";
}

// GET CSRF TOKEN
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            }
        }
    }
    return cookieValue;
}

document.addEventListener("DOMContentLoaded", () => {
    loadAvailableBooks();
    const form = document.getElementById("borrowForm");
    if (form) form.addEventListener("submit", borrowBook);
});
