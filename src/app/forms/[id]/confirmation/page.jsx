export default async function FormConfirmation() {
  return (
    <div className="flex flex-col w-full flex-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div class="flex-center flex-col bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <div class="text-green-500 text-6xl">✔️</div>
        <h2 class="text-2xl font-semibold mt-4">
          Form Submitted Successfully!
        </h2>
        <p class="text-gray-600 mt-2">
          Thank you for your submission. We have received your form.
        </p>
      </div>
    </div>
  );
}
