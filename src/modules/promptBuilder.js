/* ── Prompt Type Configuration ───────────────────────────────── */
var PROMPT_CONFIG = {
  'project-breakdown': {
    role: 'Senior Software Architect',
    outputFormat: 'Structured breakdown with sections: architecture overview, component list, data flow, technology decisions, and risk assessment.',
  },
  'task-description': {
    role: 'Senior Project Manager',
    outputFormat: 'A clear task description with: summary, acceptance criteria, dependencies, estimated effort, and definition of done.',
  },
  'acceptance-criteria': {
    role: 'Senior Business Analyst',
    outputFormat: 'A Gherkin-style table with Scenario ID, Given/When/Then steps, and priority for each scenario.',
  },
  'code-review': {
    role: 'Senior Software Engineer',
    outputFormat: 'A review checklist covering: code quality, security, performance, error handling, and adherence to coding standards.',
  },
  'test-cases': {
    role: 'Senior QA Engineer',
    outputFormat: 'A table with columns: Test Case ID, Title, Preconditions, Steps, Expected Result, Priority.',
  },
  'documentation': {
    role: 'Senior Technical Writer',
    outputFormat: 'A documentation outline with: overview, prerequisites, step-by-step instructions, configuration reference, troubleshooting, and FAQs.',
  },
};

/* ── Prompt Generation Logic ─────────────────────────────────── */
var PromptGenerator = {
  generate: function (data) {
    PromptGenerator._trimAll(data);

    var config = PROMPT_CONFIG[data.promptType];
    if (!config) {
      return '';
    }

    var lines = [];

    lines.push('Role:');
    lines.push('Act as a ' + config.role + '.');
    lines.push('');

    lines.push('Context:');
    if (data.context) {
      lines.push(data.context);
    } else {
      var moduleLabel = data.promptType === 'documentation' ? 'documentation' : 'module';
      lines.push(
        'I am working on the ' +
          (data.projectName || 'current project') +
          ' ' +
          moduleLabel +
          ' using ' +
          (data.techStack || 'the defined technology stack') +
          '.'
      );
    }
    lines.push('');

    lines.push('Task:');
    lines.push(data.mainTask);
    lines.push('');

    lines.push('Constraints:');
    lines.push(data.constraints || 'Follow standard industry best practices.');
    lines.push('');

    lines.push('Expected Output Format:');
    lines.push(data.expectedFormat || config.outputFormat);
    lines.push('');

    lines.push('Edge Cases:');
    lines.push(data.edgeCases || 'Consider common failure scenarios and boundary conditions.');

    return lines.join('\n');
  },

  validate: function (data) {
    var errors = {};
    if (!data.promptType) {
      errors.promptType = 'Please select a prompt type.';
    }
    if (!data.projectName || !data.projectName.trim()) {
      errors.projectName = 'Project or module name is required.';
    }
    if (!data.mainTask || !data.mainTask.trim()) {
      errors.mainTask = 'Main task description is required.';
    }
    return errors;
  },

  _trimAll: function (data) {
    for (var key in data) {
      if (data.hasOwnProperty(key) && typeof data[key] === 'string') {
        data[key] = data[key].trim();
      }
    }
  },
};

/* ── UI Controller ───────────────────────────────────────────── */
var UiController = {
  els: {},
  _toastTimer: null,

  init: function () {
    UiController._cacheElements();
    UiController._bindEvents();
    UiController._restoreLastType();
    UiController._updateDefaults();
  },

  _cacheElements: function () {
    UiController.els = {
      form: document.getElementById('promptForm'),
      promptType: document.getElementById('promptType'),
      projectName: document.getElementById('projectName'),
      techStack: document.getElementById('techStack'),
      context: document.getElementById('context'),
      mainTask: document.getElementById('mainTask'),
      constraints: document.getElementById('constraints'),
      expectedFormat: document.getElementById('expectedFormat'),
      edgeCases: document.getElementById('edgeCases'),
      generateBtn: document.getElementById('generateBtn'),
      copyBtn: document.getElementById('copyBtn'),
      resetBtn: document.getElementById('resetBtn'),
      output: document.getElementById('output'),
      toast: document.getElementById('toast'),
    };

    UiController.els.validation = {
      promptType: document.getElementById('validPromptType'),
      projectName: document.getElementById('validProjectName'),
      mainTask: document.getElementById('validMainTask'),
    };
  },

  _bindEvents: function () {
    UiController.els.promptType.addEventListener('change', function () {
      UiController._updateDefaults();
      UiController._saveLastType();
    });

    UiController.els.generateBtn.addEventListener('click', function (e) {
      e.preventDefault();
      UiController._handleGenerate();
    });

    UiController.els.copyBtn.addEventListener('click', function () {
      UiController._handleCopy();
    });

    UiController.els.resetBtn.addEventListener('click', function (e) {
      e.preventDefault();
      UiController._handleReset();
    });

    UiController.els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      UiController._handleGenerate();
    });
  },

  _updateDefaults: function () {
    var type = UiController.els.promptType.value;
    var config = PROMPT_CONFIG[type];
    if (config) {
      UiController.els.expectedFormat.value = config.outputFormat;
    } else {
      UiController.els.expectedFormat.value = '';
    }
  },

  _saveLastType: function () {
    try {
      localStorage.setItem('promptBuilderLastType', UiController.els.promptType.value);
    } catch (e) {
      /* localStorage unavailable */
    }
  },

  _restoreLastType: function () {
    try {
      var saved = localStorage.getItem('promptBuilderLastType');
      if (saved && PROMPT_CONFIG[saved]) {
        UiController.els.promptType.value = saved;
      }
    } catch (e) {
      /* localStorage unavailable */
    }
  },

  _handleGenerate: function () {
    var data = {
      promptType: UiController.els.promptType.value,
      projectName: UiController.els.projectName.value,
      techStack: UiController.els.techStack.value,
      context: UiController.els.context.value,
      mainTask: UiController.els.mainTask.value,
      constraints: UiController.els.constraints.value,
      expectedFormat: UiController.els.expectedFormat.value,
      edgeCases: UiController.els.edgeCases.value,
    };

    var errors = PromptGenerator.validate(data);
    UiController._clearValidation();

    if (Object.keys(errors).length > 0) {
      for (var field in errors) {
        if (errors.hasOwnProperty(field)) {
          var inputEl = UiController.els[field];
          var msgEl = UiController.els.validation[field];
          if (inputEl) {
            inputEl.classList.add('field-error');
          }
          if (msgEl) {
            msgEl.textContent = errors[field];
          }
        }
      }
      return;
    }

    var prompt = PromptGenerator.generate(data);
    UiController.els.output.textContent = prompt;
    UiController.els.copyBtn.disabled = false;
  },

  _clearValidation: function () {
    for (var key in UiController.els.validation) {
      if (UiController.els.validation.hasOwnProperty(key)) {
        UiController.els.validation[key].textContent = '';
      }
    }
    var allEls = UiController.els;
    for (var k in allEls) {
      if (allEls.hasOwnProperty(k) && allEls[k] && allEls[k].classList) {
        allEls[k].classList.remove('field-error');
      }
    }
  },

  _handleCopy: function () {
    var text = UiController.els.output.textContent;
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          UiController._showToast('Copied to clipboard!');
        },
        function () {
          UiController._fallbackCopy(text);
        }
      );
    } else {
      UiController._fallbackCopy(text);
    }
  },

  _fallbackCopy: function (text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    UiController._showToast('Copied to clipboard!');
  },

  _handleReset: function () {
    UiController.els.form.reset();
    UiController.els.output.textContent = '';
    UiController.els.copyBtn.disabled = true;
    UiController._clearValidation();
    UiController._updateDefaults();
  },

  _showToast: function (msg) {
    UiController.els.toast.textContent = msg;
    UiController.els.toast.className = 'toast show';

    clearTimeout(UiController._toastTimer);
    UiController._toastTimer = setTimeout(function () {
      UiController.els.toast.classList.remove('show');
    }, 2500);
  },
};

/* ── Boot ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  UiController.init();
});
