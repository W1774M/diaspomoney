import { SecurityCaptcha } from "@/components/ui/SecurityCaptcha";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock des timers pour les tests asynchrones
vi.useFakeTimers();

describe("SecurityCaptcha", () => {
  const mockOnSuccess = vi.fn();
  const mockOnFail = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  it("should render captcha challenge", async () => {
    render(<SecurityCaptcha onSuccess={mockOnSuccess} onFail={mockOnFail} />);

    await waitFor(() => {
      expect(screen.getByText("Vérification de sécurité")).toBeInTheDocument();
      expect(
        screen.getByText("Résolvez ce problème pour continuer")
      ).toBeInTheDocument();
    });
  });

  it("should display a mathematical question", async () => {
    render(<SecurityCaptcha onSuccess={mockOnSuccess} onFail={mockOnFail} />);

    await waitFor(() => {
      const questionElement = screen.getByText(/Quel est le résultat de/);
      expect(questionElement).toBeInTheDocument();
    });
  });

  it("should display 4 answer options", async () => {
    render(<SecurityCaptcha onSuccess={mockOnSuccess} onFail={mockOnFail} />);

    await waitFor(() => {
      const options = screen
        .getAllByRole("button")
        .filter((button) => /^\d+$/.test(button.textContent || ""));
      expect(options).toHaveLength(4);
    });
  });

  it("should call onSuccess when correct answer is selected", async () => {
    render(<SecurityCaptcha onSuccess={mockOnSuccess} onFail={mockOnFail} />);

    await waitFor(() => {
      const questionElement = screen.getByText(/Quel est le résultat de/);
      const questionText = questionElement.textContent || "";

      // Extraire les nombres de la question
      const numbers = questionText.match(/(\d+)/g);
      if (numbers && numbers.length >= 2) {
        const num1 = parseInt(numbers[0]);
        const num2 = parseInt(numbers[1]);
        const operation = questionText.includes("+")
          ? "+"
          : questionText.includes("-")
          ? "-"
          : "×";

        let correctAnswer;
        if (operation === "+") correctAnswer = num1 + num2;
        else if (operation === "-") correctAnswer = num1 - num2;
        else correctAnswer = num1 * num2;

        // Trouver et cliquer sur la bonne réponse
        const correctButton = screen.getByText(correctAnswer.toString());
        fireEvent.click(correctButton);

        // Soumettre le formulaire
        const submitButton = screen.getByText("Vérifier");
        fireEvent.click(submitButton);
      }
    });

    // Attendre que le callback soit appelé
    await waitFor(
      () => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 }
    );
  });

  it("should call onFail after max attempts", async () => {
    render(
      <SecurityCaptcha
        onSuccess={mockOnSuccess}
        onFail={mockOnFail}
        maxAttempts={2}
      />
    );

    await waitFor(() => {
      // Sélectionner une mauvaise réponse plusieurs fois
      const wrongButton = screen.getByText("999"); // Réponse improbable
      fireEvent.click(wrongButton);

      const submitButton = screen.getByText("Vérifier");
      fireEvent.click(submitButton);
    });

    // Deuxième tentative
    await waitFor(() => {
      const wrongButton = screen.getByText("999");
      fireEvent.click(wrongButton);

      const submitButton = screen.getByText("Vérifier");
      fireEvent.click(submitButton);
    });

    // Attendre que onFail soit appelé
    await waitFor(
      () => {
        expect(mockOnFail).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 }
    );
  });

  it("should show error message on wrong answer", async () => {
    render(<SecurityCaptcha onSuccess={mockOnSuccess} onFail={mockOnFail} />);

    await waitFor(() => {
      const wrongButton = screen.getByText("999");
      fireEvent.click(wrongButton);

      const submitButton = screen.getByText("Vérifier");
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Réponse incorrecte. Veuillez réessayer.")
      ).toBeInTheDocument();
    });
  });

  it("should show remaining attempts", async () => {
    render(
      <SecurityCaptcha
        onSuccess={mockOnSuccess}
        onFail={mockOnFail}
        maxAttempts={3}
      />
    );

    await waitFor(() => {
      const wrongButton = screen.getByText("999");
      fireEvent.click(wrongButton);

      const submitButton = screen.getByText("Vérifier");
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Tentatives restantes : 2")).toBeInTheDocument();
    });
  });

  it("should generate new challenge on refresh", async () => {
    render(<SecurityCaptcha onSuccess={mockOnSuccess} onFail={mockOnFail} />);

    await waitFor(() => {
      const firstQuestion = screen.getByText(
        /Quel est le résultat de/
      ).textContent;

      const refreshButton = screen.getByText("Nouveau problème");
      fireEvent.click(refreshButton);

      const secondQuestion = screen.getByText(
        /Quel est le résultat de/
      ).textContent;

      // Les questions devraient être différentes
      expect(firstQuestion).not.toBe(secondQuestion);
    });
  });

  it("should disable submit button when no answer is selected", async () => {
    render(<SecurityCaptcha onSuccess={mockOnSuccess} onFail={mockOnFail} />);

    await waitFor(() => {
      const submitButton = screen.getByText("Vérifier");
      expect(submitButton).toBeDisabled();
    });
  });

  it("should enable submit button when answer is selected", async () => {
    render(<SecurityCaptcha onSuccess={mockOnSuccess} onFail={mockOnFail} />);

    await waitFor(() => {
      const answerButton = screen.getByText("1");
      fireEvent.click(answerButton);

      const submitButton = screen.getByText("Vérifier");
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("should show loading state during verification", async () => {
    render(<SecurityCaptcha onSuccess={mockOnSuccess} onFail={mockOnFail} />);

    await waitFor(() => {
      const answerButton = screen.getByText("1");
      fireEvent.click(answerButton);

      const submitButton = screen.getByText("Vérifier");
      fireEvent.click(submitButton);

      expect(screen.getByText("Vérification...")).toBeInTheDocument();
    });
  });

  it("should apply custom className", async () => {
    const { container } = render(
      <SecurityCaptcha
        onSuccess={mockOnSuccess}
        onFail={mockOnFail}
        className="custom-class"
      />
    );

    await waitFor(() => {
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
