async function loadReservationForm() {
  const locations = await fetch('/api/locations').then((r) => r.json());
  document.getElementById('location').innerHTML = locations
    .map((l) => `<option value="${l.id}">${l.name}</option>`)
    .join('');
}

async function submitReservation(event) {
  event.preventDefault();

  const location_id = document.getElementById('location').value;
  const name = document.getElementById('name').value;
  const party_size = document.getElementById('party_size').value;
  const reservation_time = document.getElementById('reservation_time').value;

  const res = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location_id, name, party_size, reservation_time }),
  });
  const reservation = await res.json();

  if (!res.ok) {
    document.getElementById('result').innerHTML = `<p class="note">${reservation.error}</p>`;
    return;
  }

  document.getElementById('reservation-form').style.display = 'none';
  document.getElementById('result').innerHTML = `
    <h2>Reservation #${reservation.id} confirmed</h2>
    <p class="lede">${reservation.name} — party of ${reservation.party_size} — ${reservation.location_name} — ${reservation.reservation_time}</p>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadReservationForm();
  document.getElementById('reservation-form').addEventListener('submit', submitReservation);
});