import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ErrorState, PageLoader } from "../components/common/Feedback";
import { MedicationForm, medicationToFormValues } from "../components/medications/MedicationForm";
import { useToast } from "../context/UIContext";
import { extractErrorMessage } from "../services/api";
import { medicationService } from "../services/resourceServices";

export default function AddEditMedicationPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [medication, setMedication] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    medicationService
      .get(id)
      .then(setMedication)
      .catch((err) => setError(extractErrorMessage(err, "Could not load this medicine.")))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (values) => {
    try {
      if (isEdit) {
        await medicationService.update(id, values);
        showToast("Medication updated.", "success");
      } else {
        await medicationService.create(values);
        showToast("Medication added.", "success");
      }
      navigate("/app/medications");
    } catch (err) {
      showToast(extractErrorMessage(err, "Could not save this medicine."), "error");
      throw err; // let the form know saving failed so it stops its own spinner correctly
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/app/medications" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeft size={15} /> Back to Medications
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold text-slate-900 dark:text-white">{isEdit ? "Edit Medication" : "Add Medication"}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {isEdit ? "Update the dosage, schedule, or details below." : "Fill in the details, or describe it in plain English and let MediCare fill the form."}
      </p>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5 sm:p-7">
        {loading ? (
          <PageLoader label="Loading medicine…" />
        ) : error ? (
          <ErrorState description={error} onRetry={() => window.location.reload()} />
        ) : (
          <MedicationForm
            initialValues={isEdit ? medicationToFormValues(medication) : undefined}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/medications")}
            submitLabel={isEdit ? "Save Changes" : "Save Medication"}
          />
        )}
      </div>
    </div>
  );
}
