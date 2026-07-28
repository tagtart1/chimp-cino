import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./CustomSelect.scss";

const CustomSelect = ({
  className = "",
  disabled = false,
  label,
  menuLabel = `${label} options`,
  onChange,
  options,
  placeholder = "Select",
  renderIcon,
  value,
}) => {
  const menuId = useId();
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const selectedOption = options[selectedIndex];
  const isDisabled = disabled || options.length === 0;

  const closeMenu = ({ restoreFocus = false } = {}) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const openMenu = (index = selectedIndex) => {
    if (isDisabled) return;
    setActiveIndex(index);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const frameId = requestAnimationFrame(() => {
      optionRefs.current[activeIndex]?.focus();
    });

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [activeIndex, isOpen]);

  const handleTriggerKeyDown = (event) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? options.length - 1
          : event.key === "ArrowUp"
            ? (selectedIndex - 1 + options.length) % options.length
            : (selectedIndex + 1) % options.length;
    openMenu(nextIndex);
  };

  const handleOptionKeyDown = (event) => {
    let nextIndex = activeIndex;

    if (event.key === "ArrowDown") {
      nextIndex = (activeIndex + 1) % options.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = (activeIndex - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    } else if (event.key === "Tab") {
      closeMenu();
      return;
    } else {
      return;
    }

    event.preventDefault();
    setActiveIndex(nextIndex);
  };

  const handleEscape = (event) => {
    if (event.key !== "Escape" || !isOpen) return;

    event.preventDefault();
    event.stopPropagation();
    closeMenu({ restoreFocus: true });
  };

  const selectOption = (option) => {
    if (option.value !== value) onChange(option.value);
    closeMenu({ restoreFocus: true });
  };

  return (
    <div
      className={`custom-select${className ? ` ${className}` : ""}`}
      ref={containerRef}
      onKeyDownCapture={handleEscape}
    >
      <button
        className="custom-select__trigger"
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${selectedOption?.label ?? placeholder}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        disabled={isDisabled}
        onClick={() => {
          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {renderIcon && selectedOption ? (
          <span className="custom-select__icon">
            {renderIcon(selectedOption)}
          </span>
        ) : null}
        <span className="custom-select__label">
          {selectedOption?.label ?? placeholder}
        </span>
        <svg
          className={`custom-select__chevron${
            isOpen ? " is-open" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id={menuId}
            className="custom-select__menu"
            role="listbox"
            aria-label={menuLabel}
            initial={{ opacity: 0, y: -7, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onKeyDown={handleOptionKeyDown}
          >
            <span className="custom-select__arrow" aria-hidden="true" />
            {options.map((option, index) => (
              <button
                className={`custom-select__option${
                  option.value === value ? " is-selected" : ""
                }`}
                key={option.value}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                role="option"
                aria-selected={option.value === value}
                tabIndex={index === activeIndex ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
              >
                {renderIcon ? (
                  <span className="custom-select__option-icon">
                    {renderIcon(option)}
                  </span>
                ) : null}
                <span className="custom-select__option-label">
                  {option.label}
                </span>
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
