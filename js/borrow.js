// Token check
const token = localStorage.getItem("accessToken");
if (!token) {
    window.location.href = "/";
}

const BORROW_URL = "https://readershideout-backend.onrender.com/api/borrowings/";

let allTransactions = [];

// LOAD BORROWED TRANSACTIONS
async function loadBorrowed(searchTerm = '') {
    try {
        const res = await fetch(BORROW_URL, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.status === 401) return window.location.href = "/";

        allTransactions = await res.json();

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        let processedTransactions = allTransactions;

        if (lowerCaseSearchTerm) {
            processedTransactions = allTransactions.filter(tx => {
                const bookTitle = tx.book?.title.toLowerCase() || '';
                const borrowerName = tx.borrower?.name.toLowerCase() || '';
                return bookTitle.includes(lowerCaseSearchTerm) || borrowerName.includes(lowerCaseSearchTerm);
            });
        }

        renderTransactions(processedTransactions);
    } catch (err) {
        console.error("Error loading borrowed books:", err);
        alert("Failed to load borrowed books.");
    }
}

// CALCULATE LIVE FINE
function calculateLiveFine(dateDueString) {
    if (!dateDueString) return 0;

    const dateDue = new Date(dateDueString);
    dateDue.setHours(0, 0, 0, 0);

    const dateCurrent = new Date();
    dateCurrent.setHours(0, 0, 0, 0);

    if (dateCurrent <= dateDue) return 0;

    const timeDifferenceMs = dateCurrent.getTime() - dateDue.getTime();
    const daysLate = Math.ceil(timeDifferenceMs / 86400000);
    return daysLate * 30;
}

// RENDER TRANSACTIONS
function renderTransactions(transactions) {
    const table = document.getElementById("borrowedTable");
    if (!table) return;
    table.innerHTML = "";

    transactions.forEach(tx => {
        const actionContent = tx.date_returned
            ? '<span class="badge bg-success">Returned</span>'
            : `<button class="btn btn-sm btn-success" onclick="returnBook(${tx.id})">Return</button>`;

        const fineDisplay = tx.date_returned
            ? tx.fine_amount
            : calculateLiveFine(tx.date_due).toFixed(2);

        table.innerHTML += `
            <tr>
                <td>${tx.book?.title || "N/A"}</td>
                <td>${tx.borrower?.name || "N/A"}</td>
                <td>${tx.borrower?.contact || "N/A"}</td>
                <td>${tx.borrower?.email || "N/A"}</td>
                <td>${tx.borrower?.address || "N/A"}</td>
                <td>${tx.date_borrowed ? new Date(tx.date_borrowed).toLocaleDateString() : ''}</td>
                <td>${tx.date_due ? new Date(tx.date_due).toLocaleDateString() : ''}</td>
                <td>${tx.date_returned ? new Date(tx.date_returned).toLocaleDateString() : 'Not returned'}</td>
                <td>${fineDisplay}</td>
                <td>${actionContent}</td>
            </tr>`;
    });
}

// MARK BOOK AS RETURNED
async function returnBook(id) {
    if (!confirm("Mark this book as returned?")) return;

    try {
        const res = await fetch(`${BORROW_URL}${id}/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ date_returned: new Date().toISOString() })
        });

        if (!res.ok) {
            const err = await res.json();
            alert("Error: " + JSON.stringify(err));
            return;
        }

        window.location.reload();
    } catch (err) {
        console.error("Network error:", err);
        alert("Failed to mark book as returned.");
    }
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
    loadBorrowed();

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-button");

    if (searchInput) {
        searchInput.addEventListener("keyup", e => loadBorrowed(e.target.value));
    }

    if (searchButton) {
        searchButton.addEventListener("click", () => {
            const searchTerm = searchInput?.value || '';
            loadBorrowed(searchTerm);
        });
    }
});
